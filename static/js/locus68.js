// TODO: user, map, location can probably be abstracted out
//       this would be a premature optimization atm
function Locus(map) {
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


  // try to restore data from browser storage
  this.restore = function() {
    // TODO
  };

  this.initUser = function() {
    // attempt to restore
    self.restore();

    var id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5);

    self.user = {
      id: id,
      lat: null,
      lng: null,
      img: USER_AVATAR
    };
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
    return JSON.parse(data);
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

  // handle a location update for a user
  this.handleUserLocationUpdate = function(userId, data) {
    var user = self.user;
    var users = self.users;

    if (userId === user.id)
      return

    // create or update the user's location
    if (userId in users) {
      self.updateUserLocation(userId, data.lat, data.lng);
    }
    else {
      self.createUser(userId, data.lat, data.lng);
    }

    user = users[userId];

    // update the user's marker
    self.updateUserMarker(user);

    // finally, render the user feed
    LocusUI.renderUserFeed(users, self.focusOther);
  };

  this.msgHandlers = {
    [MSG_TYPE.LOC_UPDATE]: this.handleUserLocationUpdate
  };

  this.handleMsg = function(msg) {
    if (msg.type in self.msgHandlers) {
      self.msgHandlers[msg.type](msg.user, msg.data);
    } else {
      console.error('handler does not exist for msg type');
    }
  };

  this.locationUpdateMsg = function() {
    var user = self.user;
    var conn = self.conn;

    var msg = {
      type: MSG_TYPE.LOC_UPDATE,
      data: {
        lat: user.lat,
        lng: user.lng
      },
      user: user.id
    };

    return msg;
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
    if (!user.marker) {
      var icon = makeMapIcon(ICON_SIZE, user.img);
      user.marker = L.marker([user.lat, user.lng], {
        icon: icon
      }).addTo(self.map);
      user.marker.on('click', self.userMarkerClick);
    } else {
      user.marker.setLatLng([user.lat, user.lng]);
    }
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

      // send out a message with the updated location
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
    var map = L.map('map').setView([46.423, -100.3248], 3);
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
    }

    baseURL = 'ws://' + document.location.host + '/ws/';
    wsURL = baseURL + room + '?id=' + id;

    conn = new WebSocket(wsURL);

    conn.onopen = function(evl) {
      self.sendMsg(self.locationUpdateMsg());
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

  this.init = function() {
    var pathname = window.location.pathname;
    self.room = pathname.substr(3, pathname.length);

    // initialize the user from saved state or generate new
    self.initUser();

    // initialize the location stuff
    initLocation(self.handleLocationUpdate);

    // initialize the map
    self.initMap();

    // initialize the socket connection
    self.initSocket();
  };

  this.init();
}


window.onload = function() {
  var locus = new Locus();
}
