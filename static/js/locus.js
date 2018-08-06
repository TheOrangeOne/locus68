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

/**
 * the main application
 */
function Locus(opts) {
  opts = opts || {};
  this.roomName = opts.roomName || null;
  this.pass = opts.pass || Crypt.hash(this.roomName);
  this.user = opts.user || null;
  this.otherUsers = opts.otherUsers || null;
  this.msgr = opts.msgr || null;
  this.map = null;
  this.host = opts.host || null;

  var self = this;

  // returns a url to the websocket to use for this room and user
  this.getWSURL = function() {
    var base = self.host + '/ws/';
    return base + self.roomName + '?id=' + self.user.id;
  };

  this.handleLocationUpdate = function(position) {
    console.log(position);
  };

  this.initComponents = function() {
    self.roomNameVue = new Vue({
      el: '#room-name',
      data: {
        roomname: self.roomName
      }
    });

    self.usersVue = new Vue({
      el: '#other-users',
      data: {
        users: self.otherUsers.list,
        test: function() {
          console.log('test');
        }
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

  this.onWSCon = function() {
    console.log('websocket connected');
    self.msgr.sendMsg({
      'user': self.user.id
    });
  };

  // handle an incoming message
  this.onMsg = function(msg) {
    console.log(msg);
  };

  this.initMsgr = function() {
    self.msgr = self.msgr || new Msgr({
      socket: Socket,
      crypto: Crypt,
      proto: location.protocol === 'https:' ? 'wss' : 'ws',
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

    self.map.init();
  };

  // TODO: i don't like this pattern
  this.initStart = function() {
    self.initUser();
    self.initOtherUsers();
    self.initMsgr();
  };

  // TODO: i don't like this pattern
  this.initFinish = function() {
    self.initMap();
    self.initComponents();
    self.otherUsers.addUser(new User());
    self.otherUsers.addUser(new User());
    self.otherUsers.addUser(new User());
    self.otherUsers.addUser(new User());
  };
};


// establishes a websocket connection
Locus.initWS = function(locus, iopts, next) {
  var room = locus.roomName;
  var ellip = room.length > 16 ? '...' : '';
  var sroom = room.substr(0, 16) + ellip;
  iopts.log.push({
    type: 'info',
    msg: 'connecting to room ' + sroom
  });

  // TODO:
  // user, otherUsers should be initialized by this point
  locus.initStart();

  // not sure if this is the best approach
  // we could also have this wait logic implemented on send
  waitForMsgr = function() {
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

// attempts to restore state from localStorage
Locus.restore = function(opts, next) {
  opts = opts || {};
  opts.initopts.log.push({
    type: 'info',
    msg: 'checking for saved data'
  });
  var locus = new Locus(opts);
  next(locus, opts.initopts);
};


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
