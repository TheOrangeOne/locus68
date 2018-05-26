function Locus(map) {
  // a leaflet map
  this.map = map;

  // the user
  this.user = {
    id: null,
    room: DEFAULT_ROOM,
    lat: null,
    lng: null,
    img: DEFAULT_PP
  };

  // users in the room
  this.users = {};

  var self = this;

  // map stuff
  this.el_lock = null;   // the lower left icon
  this.zooming = false;  // zoom in progress
  this.zoomLevel = 17;
  this.follow = false;   // have the map track the movement

  this.setUserLatLng = function(pos) {
    var user = this.user;
    user.lat = pos.coords.latitude;
    user.lng = pos.coords.longitude;
    if (user.marker) {
      user.marker.setLatLng(new L.LatLng(user.lat, user.lng));
    }
  }

  this.userMarkerClick = function() {
    console.log('clicked!');
  };

  this.updateUserMarker = function(regen) {
    var user = self.user;

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

  this.handleChangedLocation = function(position) {
    var user = self.user;
    var lat = position.coords.lattitude;
    var lon = position.coords.longitude;

    if (lat !== user.lat || lon !== user.lon) {
      self.setUserLatLng(position);
      if (self.follow && !self.zooming) {
        self.map.setView([user.lat, user.lng], self.map.getZoom());
      }
      self.updateUserMarker();
    }
  };

  this.toggleFollowMovement = function() {
    var user = self.user;
    self.follow = !self.follow;
    self.el_lock.setAttribute('src', user.img);
    if (self.follow) {
      self.el_lock.classList.remove('untracked');
      self.map.setView([user.lat, user.lng], self.zoomLevel);
    } else {
      self.el_lock.classList.add('untracked');
    }
  };

  this.focusUser = function(user) {
    self.map.flyTo([user.lat, user.lng], self.zoomLevel, {
      //duration: 5
    });
  };

  this.focusOther = function(users, otherid) {
    var other = self.users[otherid];
    self.map.flyTo([other.lat, other.lng], self.zoomLevel, {
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
    var el_lock = null;

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
        self.el_lock = el;
        return el;
      }
    });

    map.addControl(new lockControl());

    self.map = map;
  };

  this.init = function() {

    // initialize the location stuff
    initLocation(self.handleChangedLocation);

    // initialize the map
    self.initMap();
  };

  this.init();
}


window.onload = function() {
  var locus = new Locus(map);
}
