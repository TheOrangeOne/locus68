
function Map(opts) {
  opts = opts || {};
  this.initView = opts.initView || [46.423, -100.3248];
  this.initZoom = opts.initZoom || 3;
  this.elMap = opts.elMap || 'map';
  this.tileURL = opts.tileURL || Map.DEFAULT_TILE_URL;
  this.user = opts.user || null;
  this.otherUsers = opts.otherUsers || null;

  this.zooming = false;  // zoom in progress
  this.userLock = false;  // track the movement
  this.groupLock = true;  // track the movement of the group
  this.group;            // leaflet featureGroup

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

  this.addUserLock = function() {
    self.userLockVue = new Vue({
      el: '#user-lock',
      data: {
        user: self.user
      }
    });
  };

  this.addGroupLock = function() {
    self.userGroupLock = new Vue({
      el: '#group-lock',
      data: {
        user: self.user,
        users: self.otherUsers.list,
        getStyle: function(i) {
          var offsetAngle = 360 / this.users.length;
          var rotateAngle = offsetAngle * i;
          return 'transform: rotate(' + rotateAngle + 'deg) translate(0px, -20px) rotate(-' + rotateAngle + 'deg);';
        }
      }
    });
  };

  this.init = function() {
    self.map = L.map(self.elMap, {
      zoomControl: false
    }).setView(self.initView, self.initZoom);

    L.tileLayer(self.tileURL, {
      attribution: '<a href="http://osm.org/copyright">OSM</a>'
    }).addTo(self.map);

    self.map.on('zoomstart', self.zoomstart);
    self.map.on('zoomend', self.zoomend);
    self.map.on('dragstart', self.dragstart);
    // disable double clicking
    self.map.doubleClickZoom.disable();

    // add map components
    self.addUserLock();
    self.addGroupLock();

    // create a group for the markers
    var group = new L.FeatureGroup().addTo(self.map);
    self.group = group;
  };
};

Map.DEFAULT_TILE_URL = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';

if (typeof window === 'undefined') {
  module.exports = Map;
}
