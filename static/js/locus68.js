// TODO: user, map, location can probably be abstracted out
//       this would be a premature optimization atm
function Locus() {
  // thx javascript
  var self = this;

  // the user
  this.user;

  // other users in the room
  this.users = {};

  // websocket stuff
  this.conn;   // websocket connection

  // map stuff
  this.FOCUS_ZOOM_LEVEL = 18;
  this.elUserLock;   // the user lock control
  this.elGroupLock;  // the group lock control
  this.melGroupLock;  // the group lock control (map parent)
  this.zooming = false;  // zoom in progress
  this.userLock = false;   // track the movement
  this.groupLock = true;   // track the movement of the group
  this.group;            // leaflet featureGroup

  // location stuff
  this.firstLocationUpdate = true; // used to set the zoom initially


  this.makeUser = function() {
    var user = {
      id: undefined,
      lat: undefined,
      lng: undefined,
      img: undefined,
      marker: undefined
    };

    return user;
  };

  this.makeUsers = function() {
    var users = {};
    return users;
  };

  this.initUser = function() {
    var user = self.user;

    var id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5);

    self.user = {
      id: user.id || id,
      lat: user.lat || null,
      lng: user.lng || null,
      img: user.img || USER_AVATAR
    };
  };

  // serialize a user so that it can be persisted
  this.serializeUser = function(user) {
    // what to actually serialize for a user
    var serUser = {
      id: user.id,
      lat: user.lat,
      lng: user.lng,
      img: user.img
    };

    return JSON.stringify(serUser);
  };

  // deserialize a persisted user
  this.deserializeUser = function(serUser) {
    var user = self.makeUser();
    try {
      user = JSON.parse(serUser);
    } catch (err) {
      console.warn('deserializing user failed');
    }

    return user;
  };

  // serialize the users
  this.serializeUsers = function(users) {
    var serUsers = {};
    for (userId in users) {
      serUsers[userId] = self.serializeUser(users[userId]);
    }

    return JSON.stringify(serUsers);
  };

  this.deserializeUsers = function(serUsers) {
    var users = self.makeUsers();
    try {
      var us = JSON.parse(serUsers);
      for (userid in us) {
        users[userid] = self.deserializeUser(us[userid]);
      }
    } catch (err) {
      console.warn('deserializing users failed');
    }

    return users;
  };

  // persist all relevant state to localStorage to allow seamless
  // rejoining
  this.persist = function(cleanExit) {
    var state = {
      user: self.serializeUser(self.user),
      users: self.serializeUsers(self.users),
      ts: Date.now(),
      cleanExit: cleanExit
    };

    var serState = JSON.stringify(state);
    localStorage.setItem(self.room, serState);
  }

  // attempt to restore data from browser storage
  this.restore = function() {
    var room;

    room = localStorage.getItem(self.room);
    if (!room) {
      return;
    }

    room = JSON.parse(room);
    if (!('ts' in room)) {
      console.warn('corrupted save data');
      return;
    }

    var tdelta = (Date.now() - room.ts) / 1000;
    if (tdelta > CACHE_LIFETIME) {
      localStorage.removeItem(room);
      return;
    }

    self.user = self.deserializeUser(room['user']);
    self.users = self.deserializeUsers(room['users']);
  };

  this.persister = function() {
    self.persist(false);
    setTimeout(self.persister, PERSIST_INTERVAL);
  };

  // initialize a persistor
  this.initPersister = function() {
    this.persister();
  };

  // periodically send out a location update
  this.updater = function() {
    self.sendMsg(self.locationUpdateMsg());
    setTimeout(self.updater, UPDATE_INTERVAL);
  };

  this.initUpdater = function() {
    this.updater();
  };

  // encrypt, sign and finally send a message
  this.sendMsg = function(msg) {
    // TODO: encrypt, sign
    var conn = self.conn;
    if (conn && conn.readyState == WS_STATE.OPEN) {
      conn.send(JSON.stringify(msg));
    }
  };

  this.recvMsg = function(data) {
    // TODO: verify, decrypt
    var msg = JSON.parse(data);

    // TODO: proper verification and handling
    console.assert('user' in msg);
    console.assert('type' in msg);
    console.assert('data' in msg);

    return msg;
  };

  this.updateUserLocation = function(userId, lat, lng) {
    var user = self.users[userId];
    user.lat = lat;
    user.lng = lng;
  };

  this.createUser = function(userId, lat, lng) {
    self.users[userId] = {
      lat: lat,
      lng: lng,
      img: DEFAULT_AVATAR,
      marker: undefined
    };
  };

  // render state
  this.render = function(opts) {
    if (opts.userMarker) {
      self.updateUserMarker(self.user);
    }
    if (opts.userMarkers) {
      for (userid in self.users) {
        self.updateUserMarker(self.users[userid]);
      }
    }
    if (opts.userFeed) {
      LocusUI.renderUserFeed(self);
    }
    if (opts.userGroup) {
      LocusUI.renderUserGroup(self);
    }
  };

  // handle a location update for a user
  this.handleUserLocationUpdate = function(userId, data) {
    var user;
    var users = self.users;

    // create or update the user's location
    if (userId in users) {
      self.updateUserLocation(userId, data.lat, data.lng);
    }
    else {
      user = self.createUser(userId, data.lat, data.lng);

      // send out our location in response to the new user
      self.sendSyncMsgs();
    }

    user = users[userId];

    // finally, render the user feed
    self.render({
      userMarker: true,
      userMarkers: true
    });

    // if set to follow the group then adjust the map view accordingly
    // note: this has to come after the render because it is dependent
    // on the markers being added to the map
    if (self.groupLock && !self.zooming) {
      self.focusGroup();
    }
  };

  this.handleUserAvatarUpdate = function(userId, data) {
    var users = self.users;
    if (!(userId in users)) {
      console.error('userId not in users');
      return;
    }

    var user = users[userId];

    self.updateUserAvatar(user, data.img);

    self.render({
      userFeed: true,
      userGroup: true
    });
  };

  this.msgHandlers = {
    [MSG_TYPE.LOCATION_UPDATE]: this.handleUserLocationUpdate,
    [MSG_TYPE.AVATAR_UPDATE]: this.handleUserAvatarUpdate
  };

  this.handleMsg = function(msg) {
    console.log('got message', msg);
    if (msg.type in self.msgHandlers) {
      // shortcut if the message if from us
      if (msg.user === self.user.id)
        return;

      self.msgHandlers[msg.type](msg.user, msg.data);
    } else {
      console.error('handler does not exist for msg type');
    }
  };

  this.locationUpdateMsg = function() {
    var user = self.user;

    var msg = {
      user: user.id,
      type: MSG_TYPE.LOCATION_UPDATE,
      data: {
        lat: user.lat,
        lng: user.lng
      },
    };

    return msg;
  };

  this.avatarUpdateMsg = function() {
    var user = self.user;

    var msg = {
      user: user.id,
      type: MSG_TYPE.AVATAR_UPDATE,
      data: {
        img: user.img
      }
    };

    return msg;
  };

  this.disconnectMsg = function() {
    return {
      user: user.id,
      type: MSG_TYPE.USER_DC,
      data: {}
    };
  };

  this.setUserLatLng = function(pos) {
    var user = self.user;
    user.lat = pos.coords.latitude;
    user.lng = pos.coords.longitude;
  };

  this.userMarkerClick = function() {
    console.log('clicked!');
  };

  this.updateUserMarker = function(user) {
    if (!user.marker && user.lat && user.lng) {
      var icon = makeMapIcon(ICON_SIZE, user.img);
      user.marker = L.marker([user.lat, user.lng], {
        icon: icon
      }).addTo(self.group);
      user.marker.on('click', self.userMarkerClick);
    } else if (user.lat && user.lng) {
      user.marker.setLatLng([user.lat, user.lng]);
    } else {
      console.warn('attempted to update position with null coords');
    }
  };

  this.updateUserAvatar = function(user, img) {
    var map = self.map;

    // remove the marker from the map
    if (user.marker) {
      map.removeLayer(user.marker);
    }

    // set the fields in the user
    user.img = img;
    user.marker = undefined;

    self.updateUserMarker(user);
  };

  // sends all relevant information to bring a new user up to speed
  this.sendSyncMsgs = function() {
    self.sendMsg(self.locationUpdateMsg());
    self.sendMsg(self.avatarUpdateMsg());
  };

  this.handleLocationUpdate = function(position) {
    var user = self.user;
    var lat = position.coords.lattitude;
    var lon = position.coords.longitude;

    if (lat !== user.lat || lon !== user.lon) {
      // update the user state
      self.setUserLatLng(position);

      // update the user's marker on the map
      self.updateUserMarker(user);

      if (self.firstLocationUpdate) {
        self.focusGroup();
        self.firstLocationUpdate = false;
      }

      // if set to follow the user then adjust the map view accordingly
      if (self.userLock && !self.zooming) {
        self.map.setView([user.lat, user.lng], self.map.getZoom());
      }

      // if set to follow the group then adjust the map view accordingly
      if (self.groupLock && !self.zooming) {
        self.focusGroup();
      }

      // broadcast out our location update
      self.sendMsg(self.locationUpdateMsg());
    }
  };

  this.toggleUserLockOn = function() {
    var user = self.user;
    self.userLock = true;
    self.elUserLock.classList.add('untracked');
    self.elUserLock.classList.remove('untracked');
    self.map.setView([user.lat, user.lng], self.FOCUS_ZOOM_LEVEL);
  };

  this.toggleUserLockOff = function() {
    var user = self.user;
    self.userLock = false;
    self.elUserLock.classList.add('untracked');
  };

  this.toggleUserLock = function() {
    var user = self.user;
    self.elUserLock.setAttribute('src', user.img);
    if (self.userLock) {
      self.toggleUserLockOff();
    } else {
      self.toggleUserLockOn();
    }

    // toggle off the user lock if it's on
    if (self.groupLock) {
      self.toggleGroupLockOff();
    }
  };

  this.toggleGroupLockOff = function() {
    self.groupLock = false;
    self.elGroupLock.classList.add('untracked');
  };

  this.toggleGroupLockOn = function() {
    self.groupLock = true;
    self.elGroupLock.classList.remove('untracked');
    self.focusGroup();
  };

  this.toggleGroupLock = function() {
    var user = self.user;

    if (self.groupLock) {
      self.toggleGroupLockOff();
    } else {
      self.toggleGroupLockOn();
    }

    // toggle off the user lock if it's on
    if (self.userLock) {
      self.toggleUserLockOff();
    }
  };

  this.focusGroup = function() {
    self.map.fitBounds(self.group.getBounds().pad(0.5));
  };

  this.focusUser = function(user) {
    self.map.flyTo([user.lat, user.lng], self.FOCUS_ZOOM_LEVEL, {
      //duration: 5
    });
  };

  this.focusOther = function(otherid) {
    var other = self.users[otherid];
    self.map.flyTo([other.lat, other.lng], self.FOCUS_ZOOM_LEVEL, {
      //duration: 5
    });

    // disable any locks
    if (self.userLock) {
      self.toggleUserLockOff();
    }
    if (self.groupLock) {
      self.toggleGroupLockOff();
    }
  };

  this.initMap = function() {
    var map = L.map('map', {
      zoomControl: false
    }).setView([46.423, -100.3248], 3);
    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a href="http://osm.org/copyright">OSM</a>'
    }).addTo(map);

    map.on('zoomstart', function() {
      self.zooming = true;
    });

    map.on('zoomend', function() {
      self.zooming = false;
    });

    map.on('dragstart', function(e) {
      if (self.userLock) {
        self.toggleUserLockOff();
      }

      if (self.groupLock) {
        self.toggleGroupLockOff();
      }
    });

    map.on('zoomend', function() {});

    map.on('mouseup', function() {
      map.dragging.enable();
      map.removeEventListener('mousemove');
    });

    // create the follow-lock control
    var lockControl = L.Control.extend({
      options: {
        position: 'bottomleft'
      },
      onAdd: function(map) {
        var el = L.DomUtil.create('img', 'img-circle tracker untracked');
        el.setAttribute('src', self.user.img);
        el.onclick = self.toggleUserLock;
        self.elUserLock = el;
        return el;
      }
    });
    map.addControl(new lockControl());

    // create a group for the markers
    var group = new L.FeatureGroup().addTo(map);

    self.group = group;
    self.map = map;
  };

  this.initSocket = function() {
    var conn;
    var baseURL;
    var wsURL;
    var wsProtocol;
    var room = self.room;
    var id   = self.user.id;

    if (!window['WebSocket']) {
      // TODO: appropriate error
      console.error('websockets not supported by this browser');
    }

    wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

    baseURL = wsProtocol + '//' + document.location.host + '/ws/';
    wsURL = baseURL + room + '?id=' + id;

    conn = new WebSocket(wsURL);

    conn.onopen = function(evl) {
    }

    conn.onclose = function(evl) {
      console.log('connection closed!');
    }

    conn.onmessage = function(evt) {
      var msg = self.recvMsg(evt.data);
      self.handleMsg(msg);
    }

    // set the connection
    self.conn = conn;
  };

  this.nav = function() {
    // persist with a clean exit
    this.persist(true);
    window.location.href = '/';
  };

  this.init = function() {
    var pathname = window.location.pathname;
    self.room = pathname.substr(3, pathname.length);

    self.user = self.makeUser();
    self.users = self.makeUsers();

    // attempt to restore state from localStorage
    self.restore();

    // initialize the user
    self.initUser();

    // initialize the location stuff
    initLocation(self.handleLocationUpdate);

    // initialize the map
    self.initMap();

    // initialize the socket connection
    self.initSocket();

    // initialize the persistance logic
    self.initPersister();

    // initialize the updater
    // self.initUpdater();

    // render whatever stuff we have
    self.render({
      userMarker: true,
      userMarkers: true,
      userFeed: true,
      userGroup: true
    });
  };

  this.init();
}

var locus;
window.onload = function() {
  locus = new Locus();
}
