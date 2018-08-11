if (typeof window === 'undefined') {
  var Config = require('./conf.js'),
    Lib = require('./lib.js'),
    User = require('./user.js').User,
    Users = require('./users.js'),
    Crypt = require('./crypto.js'),
    Socket = require('./socket.js'),
    Msgr = require('./msg.js'),
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
  this.msgr = opts.msgr || null;
  this.map = null;
  this.host = opts.host || null;

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

    self.msgr.sendMsg(payload);
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

    if (msg.user == self.user.id)
      return;

    var handler = self.msgHandler(msg.type);
    if (handler) {
      handler(msg.user, msg.data);
    }
  };

  this.reconnect = function() {
    self.msgr.reconnect();
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
    self.persist(false);
    setTimeout(self.persister, Config.PERSIST_INTERVAL);
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
        getAvatarURL: function(avatar) {
          return Config.getAvatarURL(avatar);
        },
        selectAvatar: function(avatar) {
          if (self.user.updateImg(Config.getAvatarURL(avatar))) {
            self.sendUpdateMsg();
          }
        },
        leaveRoom: function(evt) {
          self.persist(true);
          window.location.href = '/';
        }
      }
    });

    self.headerVue = new Vue({
      el: '#header',
      data: {
        roomname: self.roomName,
        serverStatus: self.serverStatus,
        msgr: self.msgr,
        onSettingsClick: function(ev) {
          self.settingsVue.visible = !self.settingsVue.visible;
        },
        reconnect: self.reconnect
      },
      computed: {
        roomNamePretty: function() {
          var ellip = this.roomname.length > 13 ? '...' : '';
          return this.roomname.substr(0, 13) + ellip;
        },
      }
    });
  };

  this.initUser = function() {
    self.user = self.user || new User({
      lat: opts.lat,
      lng: opts.lng
    });
  };

  this.initOtherUsers = function() {
    self.otherUsers = self.otherUsers || new Users({
      tslsEnabled: true
    });
  };

  this.initLocation = function(pos) {
    setWatchLocation(self.handleLocationUpdate);
    self.handleLocationUpdate(pos);
  };

  this.initMsgr = function() {
    self.msgr = self.msgr || new Msgr({
      socket: Socket,
      crypto: Crypt,
      proto: self.isHTTPS ? 'wss' : 'ws',
      url: self.getWSURL(),
      pass: self.pass,
      onMsg: self.onMsg,
      onopen: self.onWSCon,
      onclose: self.onWSDC,
    });
  };

  this.initMap = function() {
    self.map = new Map({
      user: self.user,
      otherUsers: self.otherUsers
    });
  };


  // TODO: this multi-stage initialization pattern feels wrong

  // the first stage of initialization
  this.initStart = function() {
    self.initUser();
    self.initOtherUsers();
    self.initMsgr();
  };

  // the second and last stage of initialization
  this.initFinish = function() {
    self.initMap();
    self.initComponents();

    self.persister();
    self.sendUpdateMsg();

    // self.otherUsers.addUser(new User({
    //   lat: 37.774929,
    //   lng: -122.419416
    // }));
  };
};

// returns an error message if a password is invalid
// else false
Locus.isInvalidPass = function(pass) {
  if (!pass || typeof pass !== 'string')
    return 'must not be empty';
  if (pass.length < 6)
    return 'must be at least 6 characters';
  return false;
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
