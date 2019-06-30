if (typeof window === 'undefined') {
  var Config = require('./conf.js'),
    Lib = require('./lib.js'),
    MsgUser = require('./user.js').MsgUser,
    User = require('./user.js').User,
    Users = require('./users.js'),
    Crypt = require('./crypto.js'),
    Socket = require('./socket.js'),
    Map = require('./map.js')
}

var MSG_TYPE = Config.MSG_TYPE;

/**
 * the main application
 */
function Locus(opts) {
  opts = opts || {};
  this.roomName = opts.roomName || null;
  this.isSecure = !!opts.pass;
  this.isHTTPS = opts.isHTTPS || null;
  this.pass = opts.pass || Crypt.hash(this.roomName);
  this.user = opts.user || null;
  this.otherUsers = opts.otherUsers || null;
  this.socket = opts.socket || null;
  this.host = opts.host || null;
  // whether or not to persist to periodically localStorage
  this.persistEnabled = opts.persistEnabled;
  // whether user time since last seen updating is enabled
  this.tslsEnabled = opts.tslsEnabled;
  // whether or not to enable the UI (map and components)
  this.uiEnabled = opts.uiEnabled;
  this.Map = opts.Map || null;
  this.WebSocket = opts.WebSocket || null;
  this.Geolocation = opts.Geolocation || null;

  this.MSG_HANDLER = {};  // used to look up msg handlers

  var self = this;

  // registers a message handler
  this.registerMsgHandler = function(msgType, handler) {
    self.MSG_HANDLER[msgType] = handler;
  };

  // returns the corresponding handler for msgType
  this.msgHandler = function(msgType) {
    if (!(msgType in self.MSG_HANDLER)) {
      console.warn('handler not found for msgtype ', msgType);
      return null;
    }
    return self.MSG_HANDLER[msgType];
  };

  // creates a user update message
  this.updateMsg = function() {
    var msg = self.user.toMsgUser();

    return msg;
  };

  this.sendMsg = function(type, msg) {
    var payload = {
      type: type,
      user: self.user.id,
      data: msg
    };

    self.socket.send(payload);
  };

  this.sendUpdateMsg = function() {
    if (self.user.isReady()) {
      self.sendMsg(MSG_TYPE.USER_UPDATE, self.updateMsg());
    }
  };

  // returns a url to the websocket to use for this room and user
  this.getWSURL = function() {
    var base = self.host + '/ws/';
    return base + self.roomName + '?id=' + self.user.id;
  };

  this.handleLocationUpdate = function(position) {
    if (position) {
      var coords = position.coords;
      self.user.updateLocation(coords.latitude, coords.longitude);
      self.sendUpdateMsg();
    }
  };

  this.onWSCon = function() {
    console.log('websocket connected');
  };

  this.onWSDC = function() {
    console.log('websocket disconnected');
  };

  /**
   * Message handling methods
   */
  this.onUpdateMsg = function(userId, data) {
    console.assert('lat' in data && data.lat);
    console.assert('lng' in data && data.lng);
    console.assert('img' in data);
    var ret;
    ret = self.otherUsers.updateFromMsgUser(new MsgUser(data));

    // if it's a new user, then reply with an update of our own
    if (ret === Users.NEW) {
      self.sendUpdateMsg();
    }
    else if (ret === Users.UPDATE) {
    }
    else {
      console.warn('failed to update user')
    }
  };
  this.registerMsgHandler(MSG_TYPE.USER_UPDATE, this.onUpdateMsg);

  this.onConnMsg = function(userId, data) {
    // always send an update in response to a connection
    self.sendUpdateMsg();
  };
  this.registerMsgHandler(MSG_TYPE.USER_CONNECT, this.onConnMsg);

  this.onDCMsg = function(userId, data) {
    self.otherUsers.setInactive(userId);
  };
  this.registerMsgHandler(MSG_TYPE.USER_DISCONNECT, this.onDCMsg);

  // handle an incoming message
  this.onMsg = function(msg) {
    console.assert('user' in msg);
    console.assert('type' in msg);
    console.assert('data' in msg);

    if (msg.user === self.user.id)
      return;

    var handler = self.msgHandler(msg.type);
    if (handler) {
      handler(msg.user, msg.data);
    }
  };

  this.reconnect = function() {
    self.socket.reconnect();
  };

  this.persist = function(wasCleanExit) {
    wasCleanExit = wasCleanExit || false;

    var state = {
      roomName: self.roomName,
      isSecure: self.isSecure,
      user: self.user.serialize(),
      otherUsers: self.otherUsers.serialize(),
      cleanExit: wasCleanExit,
      ts: Date.now()
    };

    var serState = JSON.stringify(state);
    localStorage.setItem(self.roomName, serState);
  };

  this.persister = function() {
    if (self.persistEnabled) {
      self.persist(false);
      setTimeout(self.persister, Config.PERSIST_INTERVAL);
    }
  };

  this.isWSReady = function() {
    return self.socket.isReady();
  };

  this.initComponents = function() {
    self.settingsVue = new Vue({
      el: '#settings-overlay',
      data: {
        visible: false,
        avatars: Config.AVATARS,
        isUserAvatar: function(avatar) {
          return Config.getAvatarURL(avatar) === self.user.img;
        },
        getAvatarURL: Config.getAvatarURL,
        selectAvatar: function(avatar) {
          if (self.user.updateImg(Config.getAvatarURL(avatar))) {
            self.sendUpdateMsg();
          }
        },
        leaveRoom: function(evt) {
          self.persist(true);
          window.location.href = '/';
        },
        exitSettings: function(evt) {
          self.settingsVue.visible = !self.settingsVue.visible;
        }
      }
    });

    self.headerVue = new Vue({
      el: '#header',
      data: {
        roomname: self.roomName,
        socket: self.socket,
        onSettingsClick: function(ev) {
          self.settingsVue.visible = !self.settingsVue.visible;
        },
        reconnect: self.reconnect
      },
      computed: {
        isProd: function() {
          return Lib.isProd(self.host);
        },
        roomNamePretty: function() {
          var prefix = Lib.isProd(self.host) ? '' : '[TEST VERSION] ';
          var name = Lib.prettyRoomName(this.roomname, 13);
          return prefix + name;
        },
        socketStatus: function() {
          return this.socket.status;
        }
      }
    });
  };

  this.initUser = function(lat, lng) {
    self.user = self.user || new User({});
    self.user.updateLocation(lat, lng);
  };

  this.initOtherUsers = function() {
    self.otherUsers = self.otherUsers || new Users({
      tslsEnabled: self.tslsEnabled
    });
  };

  this.initLocationWatch = function() {
    self.Geolocation.watchPosition(
      self.handleLocationUpdate,
      function(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );
  };

  this.initSocket = function(WebSocket) {
    self.socket = self.socket || new Socket({
      WebSocket: WebSocket,
      Crypto: Crypt,
      secure: self.isHTTPS,
      url: self.getWSURL(),
      pass: self.pass,
      onMsg: self.onMsg,
      onOpen: self.onWSCon,
      onClose: self.onWSDC,
    });
  };

  this.initMap = function() {
    self.map = self.Map || new Map({
      user: self.user,
      otherUsers: self.otherUsers
    });
  };

  // the first stage of initialization
  this.initWithLocation = function(lat, lng) {
    self.initUser(lat, lng);
    self.initOtherUsers();
  };

  this.initWithWS = function(WebSocket) {
    self.initSocket(WebSocket);
  };

  /**
   * Once all other initialization has been done, then
   * it up by generating the map and view components.
   *
   * The required thing we want done before this method is
   * called are:
   * - user has been created and has the correct location
   * - websocket connection has been established
   *
   * Also kick off the location watcher, persistence and
   * send out our first update to notify other clients.
   */
  this.initFinalize = function() {
    if (self.uiEnabled) {
      self.initMap();
      self.initComponents();
    }

    self.initLocationWatch();

    self.persister();

    // send out the initial update message
    self.sendUpdateMsg();

    // use this to add users for testing
    // self.otherUsers.addUser(new User({
    //   lat: 37.774929,
    //   lng: -122.419416
    // }));
  };
};

Locus.deserialize = function(serState) {
  try {
    var state = {
      user: User.deserialize(serState.user),
      otherUsers: Users.deserialize(serState.otherUsers),
      isSecure: serState.isSecure,
      cleanExit: serState.cleanExit
    };
    return state;
  } catch(e) {
    return {};
  }
};


if (typeof window === 'undefined') {
  module.exports = Locus;
}
