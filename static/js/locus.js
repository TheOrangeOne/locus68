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
    var user, msg;

    user = self.user;
    msg = {
      id: user.id,
      lat: user.lat,
      lng: user.lng,
      img: user.img
    };

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
    self.sendMsg(MSG_TYPE.USER_UPDATE, self.updateMsg());
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


  /**
   * Message handling methods
   */
  this.onUpdateMsg = function(userId, data) {
    console.assert('lat' in data && data.lat);
    console.assert('lng' in data && data.lng);
    console.assert('img' in data);
    if (userId === self.user.id) {
      return;
    }

    var ret;
    ret = self.otherUsers.updateFromMsgUser(new MsgUser(data));

    // if it's a new user, then reply with an update of our own
    if (ret === Users.NEW) {
      self.sendUpdateMsg();
    }
    else if (ret === Users.UPDATE) {
      console.log('UPDATE');
    }
    else {
      console.warn('failed to update user')
    }
  };
  this.registerMsgHandler(MSG_TYPE.USER_UPDATE, this.onUpdateMsg);


  // handle an incoming message
  this.onMsg = function(msg) {
    console.log(msg);
    console.assert('user' in msg);
    console.assert('type' in msg);
    console.assert('data' in msg);

    var handler = self.msgHandler(msg.type);
    if (handler) {
      handler(msg.user, msg.data);
    }
  };

  this.initComponents = function() {
    self.roomNameVue = new Vue({
      el: '#room-name',
      data: {
        roomname: self.roomName
      }
    });
  };

  this.initUser = function() {
    self.user = new User({
      lat: opts.lat,
      lng: opts.lng
    });
  };

  this.initOtherUsers = function() {
    self.otherUsers = new Users();
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
      onopen: self.onWSCon
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

    self.sendUpdateMsg();

    // TODO: remove test data
    // self.otherUsers.addUser(new User({
    //   lat: 37.774929,
    //   lng: -121.419416
    // }));
  };
};

/**
 *
 */
Locus.initWS = function(locus, iopts, next) {
  var room = locus.roomName;
  var ellip = room.length > 16 ? '...' : '';
  var sroom = room.substr(0, 16) + ellip;
  iopts.log.push({
    type: 'info',
    msg: 'connecting to room ' + sroom
  });

  locus.initStart();

  // not sure if this is the best approach
  // we could also have this wait logic implemented on send
  var waitForMsgr = function() {
    setTimeout(function() {
      if (!locus.msgr.isReady()) {
        iopts.log.push({ type: 'info', msg: 'connecting...' });
        waitForMsgr();
      }
      else {
        iopts.log.push({ type: 'info', msg: 'connected!' });
        next(locus, iopts);
      }
    }, 5);
  };

  waitForMsgr(locus, next);
};

/**
 *
 */
Locus.initLocation = function(locus, iopts, next) {
  iopts.log.push({
    type: 'info',
    msg: 'getting location'
  });
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        iopts.log.push({
          type: 'info',
          msg: 'got location!'
        });
        locus.initLocation(pos);
        next(locus, iopts);
      },
      function(err) {
        iopts.log.push({
          type: 'error',
          msg: 'failed to get location!'
        });
      }, {
        enableHighAccuracy: true,
        timeout: 15000,  // wait 15s for location
        maximumAge: 0  // fetch latest location
      }
    )
  }
  else {
    iopts.log.push({
      type: 'error',
      msg: 'failed to get location!'
    });
  }
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

/**
 * determines required room information
 * for a regular room:
 *  - the room name
 * for a secure room:
 *  - the room password
 *  - the room name
 * only on success will initRoom move on to next()
 */
Locus.initRoom = function(opts, next) {
  opts = opts || {};
  var path = opts.path;

  opts.initopts.log.push({
    type: 'info',
    msg: 'initializing room'
  });

  if (path.substr(0, 3) === '/r/') {
    opts.roomName = path.substr(3, path.length);
    next(opts);
  }
  else if (path === '/x' || path == '/x/') {
    opts.initopts.roomKeyEnabled = true;
    opts.initopts.roomKeyVisible = true;

    // run on submit of room key
    opts.initopts.roomKeySubmit = function(e) {
      var val = e.target.value;
      if (!Locus.isInvalidPass(val)) {
        opts.initopts.roomKeyEnabled = false;
        opts.initopts.roomKeyVisible = false;
        opts.pass = e.target.value;
        opts.roomName = Crypt.hash(opts.pass).toHex();
        next(opts);
      } else {
        opts.initopts.log.push({
          type: 'warn',
          msg: 'key ' + Locus.isInvalidPass(val)
        });
      }
    };
  } else {
    // backend should prevent us from ever getting here
    opts.initopts.log.push({
      type: 'error',
      msg: 'invalid route specified'
    });
  }
};

/**
 * Attempts to restore state from localStorage
 */
Locus.restore = function(opts, next) {
  opts = opts || {};
  opts.initopts.log.push({
    type: 'info',
    msg: 'checking for saved data'
  });
  var locus = new Locus(opts);
  next(locus, opts.initopts);
};

/**
 * Initializes a Locus instance using the browser.
 */
Locus.init = function(opts) {
  opts = opts || {};
  opts.initopts = opts.initopts || {};

  opts.initopts.roomKeyVisible = false;
  opts.initopts.roomKeyEnabled = true;
  opts.initopts.initializing = true;
  opts.initopts.log = [{msg: 'initializing...', type: 'info'}];

  var initWindow = new Vue({
    el: '#initOverlay',
    data: {
      opts: opts.initopts,
    }
  });

  opts.isHTTPS = location.protocol === 'https:';

  Locus.initRoom(opts, function(opts) {
    Locus.restore(opts, function(locus, iopts) {
      // restore will instantiate a Locus obj
      Locus.initWS(locus, iopts, function(locus, iopts) {
        Locus.initLocation(locus, iopts, function(locus, iopts) {
          opts.initopts.initializing = false;
          locus.initFinish();
        });
      });
    });
  });
};


if (typeof window === 'undefined') {
  module.exports = Locus;
}
