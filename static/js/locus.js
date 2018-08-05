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
 * The main application.
 */
function Locus(opts) {
  opts = opts || {};
  this.roomName = opts.roomName || null;
  this.pass = opts.pass || Crypt.hash(this.roomName);
  this.user = null;
  this.otherUsers = null;
  this.crypto = new Crypt({
  });
  this.socket = null;
  this.msgr = null;
  this.map = null;

  var user = new User();
  var self = this;

  // returns a url to the websocket to use for this room and user
  this.getWSURL = function() {
    var base = document.location.host + '/ws/';
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
    self.msgr = new Msgr({
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


if (typeof window === 'undefined') {
  module.exports = Locus;
}
