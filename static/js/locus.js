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
 * the main application.
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

  var user = new User();
  var self = this;

  // returns a url to the websocket to use for this room and user
  this.getWSURL = function() {
    var base = self.host + '/ws/';
    return base + self.roomName + '?id=' + self.user.id;
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

  this.init = function() {
    self.initUser();
    self.initOtherUsers();
    // var otherUser = new User();
    // self.otherUsers.addUser(otherUser);

    self.initMsgr();
    self.initMap();
    self.initComponents();
    // var otherUser = new User();
    // self.otherUsers.addUser(otherUser);
    // self.otherUsers.removeUser(otherUser.id);
  };

  this.init();
};


// establishes a websocket connection
Locus.initWS = function(opts, next) {
  opts = opts || {};

  next(opts);
};

Locus.initLocation = function(opts, next) {
  opts = opts || {};
  next(opts);
};

// determines whether the room is a secure room
// is responsible for getting the password if the room is secure
Locus.initRoom = function(opts, next) {
  opts = opts || {};
  opts.initopts.roomKeyEnabled = true;
  opts.initopts.roomKeySubmit = function(e) {
    opts.initopts.roomKeyEnabled = false;
    console.log(e.target.value);
  };
  opts.initopts.log.push({
    type: 'info',
    msg: 'initializing room'
  })
  next(opts);
};

// attempts to restore state from localStorage
Locus.restore = function(opts, next) {
  opts = opts || {};
  next(opts);
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
    Locus.restore(opts, function(opts) {
      Locus.initWS(opts, function(opts) {
        Locus.initLocation(opts, function(opts) {
          // opts.initopts.initializing = false;
          // locus = new Locus(opts);
        });
      });
    });
  });
};

Locus.entryPoint = function(opts) {
  opts = opts || {};
  if (navigator.geolocation) {
    navigator
      .geolocation
      .getCurrentPosition(
        // on success
        function(pos) {
          console.log('step 1: location ✓');
          step2(pos);
        },
        // on error
        function(err) {
          console.error('error:', err.code, err.message);
          elLocOverlay.style.display = 'block';
        },
        // options
        {
          enableHighAccuracy: true,
          timeout: 15000,            // wait 15s for location
          maximumAge: 0              // fetch latest location
        }
      )
  }
  else {
  }
};


if (typeof window === 'undefined') {
  module.exports = Locus;
}
