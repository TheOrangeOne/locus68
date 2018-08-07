function Map(opts) {
  opts = opts || {};
  this.initView = opts.initView || [46.423, -100.3248];
  this.initZoom = opts.initZoom || 3;
  this.elMap = opts.elMap || 'map';
  this.tileURL = opts.tileURL || Map.DEFAULT_TILE_URL;
  this.user = opts.user || null;
  this.otherUsers = opts.otherUsers || null;

  this.zooming = false;  // zoom in progress
  this.userLock = opts.userLock || false;  // track the movement
  this.groupLock = opts.groupLock || true;  // track the movement of the group
  this.mapView = opts.mapView || MapView;

  var self = this;

  this.zoomstart = function() {
    self.zooming = true;
  };

  this.zoomend = function() {
    self.zooming = false;
  };

  this.dragstart = function(e) {
    self.userLock = false;
    self.groupLock = false;
  };

  this.mouseup = function() {
    self.map.dragging.enable();
    self.map.removeEventListener('mousemove');
  };

  this.toggleUserLock = function() {
    self.userLock = !self.userLock;

    if (self.groupLock) {
      self.groupLock = false;
    }
  };

  this.toggleGroupLock = function() {
    self.groupLock = !self.groupLock;

    if (self.userLock) {
      self.userLock = false;
    }
  };

  this.onUserLockClick = function(e) {
    self.toggleUserLock();
  };

  this.onGroupLockClick = function(e) {
    self.toggleGroupLock();
  };

  this.init = function() {
    self.mapView = new self.mapView(self);
  };

  self.init();
};


/**
 * View for Map
 */
function MapView(map) {
  this.map = map;

  this.lmap = L.map(map.elMap, {
    zoomControl: false
  }).setView(map.initView, map.initZoom);

  L.tileLayer(map.tileURL,{
    attribution: '<a href="http://osm.org/copyright">OSM</a>'
  }).addTo(this.lmap);

  // create a group for the markers
  this.group = new L.FeatureGroup().addTo(this.lmap);

  // keep track of the markers for each user
  this.markers = {};

  var self = this;

  this.setView = function(lat, lng) {
    self.lmap.setView([lat, lng], self.lmap.getZoom());
  };

  this.focusUser = function() {
    var user = self.map.user;
    self.setView(user.lat, user.lng);
  };

  this.focusGroup = function() {
    self.lmap.fitBounds(self.group.getBounds().pad(0.5));
  };

  this.flyToUser = function(user) {
    self.lmap.flyTo(
      [user.lat, user.lng],
      MapView.FOCUS_ZOOM_LEVEL, {
      //duration: 5
    });
  };

  this.resetView = function() {
    if (self.map.userLock) {
      self.focusUser();
    } else if (self.map.groupLock) {
      self.focusGroup();
    }
  };

  this.hasUserMarker = function(user) {
    return !!self.markers[user.id];
  };

  this.addUserMarker = function(user) {
    var marker = L.marker([user.lat, user.lng], {
      icon: MapView.userIcon(user)
    }).addTo(self.group);

    self.markers[user.id] = marker;
  };

  this.updateUserMarker = function(user) {
    if (self.hasUserMarker(user)) {
      var marker = self.markers[user.id];
      marker.setLatLng([user.lat, user.lng]);
    } else {
      self.addUserMarker(user);
    }
  };

  this.initUserAvatars = function() {
    self.userAvatarsVue = new Vue({
      data: {
        user: map.user,
        otherUsers: map.otherUsers.list
      }
    });

    self.userAvatarsVue.$watch('user', function(val, user) {
      self.updateUserMarker(user);
      self.resetView();
    }, { deep: true });

    self.userAvatarsVue.$watch('otherUsers', function(val, users) {
      var user, i;

      // TODO: make sure to remove markers for removed users
      /*
      for (i = 0; i < self.markers.length; ++i) {
        user = users[i];
        self.updateUserMarker(user);
      }*/
      self.resetView();
    }, { deep: true });
  };


  this.onUserLockClick = function(e) {
    self.map.onUserLockClick();
    self.resetView();
  };

  this.initUserLock = function() {
    self.userLockVue = new Vue({
      el: '#user-lock',
      data: {
        map: self.map,
        user: self.map.user,
        click: self.onUserLockClick
      }
    });
  };

  this.onGroupLockClick = function() {
    self.map.onGroupLockClick();
    self.resetView();
  };

  this.initGroupLock = function() {
    self.groupLockVue = new Vue({
      el: '#group-lock',
      data: {
        map: self.map,
        user: self.map.user,
        users: self.map.otherUsers.list,
        click: self.onGroupLockClick,
        getStyle: function(i) {
          var offsetAngle = 360 / this.users.length;
          var rotateAngle = offsetAngle * i;
          return 'transform: rotate(' + rotateAngle + 'deg) translate(0px, -20px) rotate(-' + rotateAngle + 'deg);';
        }
      }
    });
  };

  this.init = function() {
    // map event handlers
    self.lmap.on('zoomstart', map.zoomstart);
    self.lmap.on('zoomend', map.zoomend);
    self.lmap.on('dragstart', map.dragstart);
    self.lmap.doubleClickZoom.disable();  // disable double clicking

    // init components
    self.initUserAvatars();
    self.initUserLock();
    self.initGroupLock();
    self.addUserMarker(self.map.user);
  };

  this.init();
};

MapView.FOCUS_ZOOM_LEVEL = 18;

MapView.mapIcon = function(size, img) {
  var classes = 'img-circle ';
  return L.icon({
    iconUrl: img,
    iconSize: [size,size],
    iconAnchor: [25,50],
    popupAnchor: [0,-54],
    className: classes
  });
};

MapView.userIcon = function(user) {
  var classes = 'img-circle ';
  return L.icon({
    iconUrl: user.img,
    iconSize: [Config.ICON_SIZE, Config.ICON_SIZE],
    iconAnchor: [25,50],
    popupAnchor: [0,-54],
    className: classes
  });
};

Map.DEFAULT_TILE_URL = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';

if (typeof window === 'undefined') {
  module.exports = Map;
}
