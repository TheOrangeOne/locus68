if (typeof window === 'undefined') {
  var Config = require('./conf.js'),
    Lib = require('./lib.js'),
    User = require('./user.js').User,
    Users = require('./users.js'),
    Map = require('./map.js')
}

/**
 * The main application.
 */
function Locus(opts) {
  opts = opts || {};
  this.roomName = opts.roomName || null;
  this.user = new User({
    lat: opts.lat,
    lng: opts.lng
  });
  this.otherUsers = new Users();
  this.map = new Map({
    user: this.user
  });

  var user = new User();
  var self = this;

  this.initMap = function() {
    // create the follow-lock control
    var lockControl = L.Control.extend({
      options: {
        position: 'bottomleft'
      },
      onAdd: function(map) {
        var el = L.DomUtil.create('img', 'img-circle tracker untracked clickable');
        el.id = 'locktest';
        // el.setAttribute('src', self.user.img);
        el.setAttribute('v-bind:src', 'user.img');
        el.onclick = self.toggleUserLock;
        self.elUserLock = el;
        return el;
      }
    });
    map.addControl(new lockControl());
    window.u = {
        img: '/static/img/rand/1.png'
    };
    window.lock = new Vue({
      el: '#locktest',
      data: {
        user: window.u
      }
    });

    var settingsControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function(map) {
        var el = L.DomUtil.create('span', 'settings-button clickable');
        el.id = 'vuetest';
        el.innerHTML = '⚙';
        el.onclick = self.showSettings;
        self.elSettings = el;
        el.setAttribute('src', 'lol');
        el.setAttribute('v-bind:class', "{ untracked: !tracked }");
        return el;
      }
    });
    map.addControl(new settingsControl());

  };

  this.initComponents = function() {
    window.users = new Vue({
      el: '#other-users',
      data: {
        users: self.otherUsers.users,
        test: function() {
          console.log('test');
        }
      }
    });
  };

  this.init = function() {
    self.user.init();
    var otherUser = new User();
    otherUser.init();
    self.otherUsers.addUser(otherUser);

    self.map.init();
    self.initComponents();
  };

  this.init();
};


if (typeof window === 'undefined') {
  module.exports = Locus;
}
