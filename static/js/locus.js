if (typeof window === 'undefined') {
  Config = require('./conf.js');
  Lib = require('./lib.js');
  User = require('./user.js').User;
  Users = require('./users.js');
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

  var user = new User();
  user.init();
  this.otherUsers.addUser(user);
  var self = this;

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

    window.gear = new Vue({
      el: '#other-users',
      data: {
        users: self.otherUsers.users,
        test: function() {
          console.log('test')
        }
      }
    });

    // disable double clicking
    map.doubleClickZoom.disable();

    // create a group for the markers
    var group = new L.FeatureGroup().addTo(map);
    self.group = group;
    self.map = map;
  };

  this.initMap();
};


if (typeof window === 'undefined') {
  module.exports = Locus;
}
