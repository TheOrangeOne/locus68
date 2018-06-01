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
  this.elLock;   // the lower left icon
  this.zooming = false;  // zoom in progress
  this.follow = false;   // have the map track the movement
  this.group;            // leaflet featureGroup
  this.elGroup; // the upper left control

  this.encrypted = false;
  this.room;
  this.key;

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

  this.initUser = function() {
    // attempt to restore
    self.restore();

    var user = self.user;

    console.log('restored user', user);

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
    var user;
    try {
      user = JSON.parse(serUser);
    }
    catch (err) {
      user = self.makeUser();
    }

    return user;
  };

  // restore the specific user from localStorage
  // if restoring fails for some reason, then just make a new user
  this.restoreThisUser = function() {
    var user;

    if (window.localStorage.user) {
      var serUser = localStorage.getItem('user');
      console.log('localStorage user', serUser);
      user = self.deserializeUser(serUser);
    } else {
      user = self.makeUser();
    }

    self.user = user;
  };

  // persist the specific user to localStorage
  this.persistThisUser = function() {
    var serUser = self.serializeUser(self.user);
    console.log('persisting user', serUser);
    localStorage.setItem('user', serUser);
  };

  // try to restore data from browser storage
  this.restore = function() {
    self.restoreThisUser();
  };


  // persist all relevant state to localStorage to allow seamless
  // rejoining
  this.persist = function() {
    self.persistThisUser();
  }

  this.persistor = function() {
    self.persist();
    setTimeout(self.persistor, PERSIST_INTERVAL);
  }

  // initialize a persistor
  this.initPersistor = function() {
    this.persistor();
  };

  // encrypt, sign and finally send a message
  this.sendMsg = function(msg) {
    // TODO: encrypt, sign
    var conn = self.conn;
    if (conn && conn.readyState == WS_STATE.OPEN) {
      payload = JSON.stringify(msg);

      if (self.encrypted) {
        var cipher = forge.cipher.createCipher('AES-GCM', self.key);
        var iv = forge.random.getBytesSync(16);
        console.log("encrypting payload " + payload + " with key " + forge.util.bytesToHex(self.key) + " using iv " + forge.util.bytesToHex(iv));
        cipher.start({iv: iv});
        cipher.update(forge.util.createBuffer(payload));
        cipher.finish();
        payload = JSON.stringify({
          'iv': iv,
          'ct': cipher.output.bytes(),
          'tag': cipher.mode.tag.bytes()
        });
        console.log("sending encrypted payload " + payload);
      }

      conn.send(payload);
    }
  };

  this.recvMsg = function(data) {
    // TODO: verify, decrypt
    var msg = JSON.parse(data);

    if(self.encrypted) {
      console.assert('iv' in msg);
      console.assert('ct' in msg);
      console.assert('tag' in msg);
      console.log("got ciphertext " + forge.util.bytesToHex(msg.ct) + " with iv " + forge.util.bytesToHex(msg.iv) + " and gcm tag " + forge.util.bytesToHex(msg.tag));
      var decipher = forge.cipher.createDecipher('AES-GCM', self.key);
      decipher.start({iv: msg.iv, tag: forge.util.createBuffer(msg.tag)});
      decipher.update(forge.util.createBuffer(msg.ct));
      if (!decipher.finish()) {
        console.error("bad gcm tag! (possible tampering)");
        msg = {};
      } else {
        msg = JSON.parse(decipher.output.bytes());
        console.log("decrypted via key " + forge.util.bytesToHex(self.key) + " and got msg " + JSON.stringify(msg));
      }
    }

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

  this.updateUserUI = function() {
    var roomTitle;
    if (self.encrypted) {
      roomTitle = document.getElementById("roomkey");
    } else {
      roomTitle = document.createElement('a');
      roomTitle.innerHTML = window.location.pathname;
    }
    LocusUI.renderUserFeed(roomTitle, self.users, self.focusOther);
    LocusUI.renderUserGroup(self);
  }

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

    // update the user's marker
    self.updateUserMarker(user);

    self.updateUserUI();
  };

  this.handleUserAvatarUpdate = function(userId, data) {
    var users = self.users;
    if (!(userId in users)) {
      console.error('userId not in users');
      return;
    }

    var user = users[userId];

    self.updateUserAvatar(user, data.img);

    self.updateUserUI();
  };

  this.msgHandlers = {
    [MSG_TYPE.LOCATION_UPDATE]: this.handleUserLocationUpdate,
    [MSG_TYPE.AVATAR_UPDATE]: this.handleUserAvatarUpdate
  };

  this.handleMsg = function(msg) {
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
    } else {
      user.marker.setLatLng([user.lat, user.lng]);
    }
  };

  this.updateUserAvatar = function(user, img) {
    var map = self.map;

    // remove the marker from the map
    map.removeLayer(user.marker);

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

      // if set to follow the user then adjust the map view accordingly
      if (self.follow && !self.zooming) {
        self.map.setView([user.lat, user.lng], self.map.getZoom());
      }

      // broadcast out our location update
      self.sendMsg(self.locationUpdateMsg());
    }
  };

  this.toggleFollowMovement = function() {
    var user = self.user;
    self.follow = !self.follow;
    self.elLock.setAttribute('src', user.img);
    if (self.follow) {
      self.elLock.classList.remove('untracked');
      self.map.setView([user.lat, user.lng], self.FOCUS_ZOOM_LEVEL);
    } else {
      self.elLock.classList.add('untracked');
    }
  };

  this.focusGroup = function() {
    self.map.fitBounds(self.group.getBounds().pad(0.5));
    if (self.follow) {
      self.toggleFollowMovement();
    }
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

    if (self.follow) {
      self.toggleFollowMovement();
    }
  };

  this.initMap = function() {
    var map = L.map('map', {
      zoomControl: false
    }).setView([46.423, -100.3248], 3);
    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a href="http://osm.org/copyright">OSM</a>'
    }).addTo(map);

    // the lock button in the lower left
    var elLock = null;

    map.on('zoomstart', function() {
      self.zooming = true;
    });

    map.on('zoomend', function() {
      self.zooming = false;
    });

    map.on('dragstart', function(e) {
      if (self.follow) {
        self.toggleFollowMovement();
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
        el.onclick = self.toggleFollowMovement;
        self.elLock = el;
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
    var room = self.room;
    var id   = self.user.id;

    if (!window['WebSocket']) {
      // TODO: appropriate error
      console.error('websockets not supported by this browser');
    }

    baseURL = 'ws://' + document.location.host + '/ws/';
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

  this.initKeyField = function() {
    updateKeys = function() {
      self.key = forge.pkcs5.pbkdf2(el_input.value, 'nacl', 10000, 16);
      if (el_input.value) {
        self.room = cryptoHash(self.key).toHex();
      } else {
        self.room = '__DEFAULT__';
      }
      console.log('new key ' + forge.util.bytesToHex(self.key) + ' and room ' + self.room);
    }

    el_input = document.getElementById("roomkey");
    el_input.onchange = updateKeys;
    updateKeys();
  };

  this.init = function() {
    var pathname = window.location.pathname;

    if (pathname.substr(0, 3) === "/r/") {
      self.room = pathname.substr(3, pathname.length);
    } else
    if (pathname === "/x" || pathname === "/x/") {
      self.encrypted = true;
      self.initKeyField();
    } else
    console.error("invalid room url");

    // initialize the user from saved state or generate new
    self.initUser();

    // initialize the location stuff
    initLocation(self.handleLocationUpdate);

    // initialize the map
    self.initMap();

    // initialize the socket connection
    self.initSocket();

    // initialize the persistance logic
    self.initPersistor();

    // setup ui with list of users and room name
    self.updateUserUI();
  };

  this.init();
}


window.onload = function() {
  var locus = new Locus();
}
