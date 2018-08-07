var assert = require('assert');
var Map = require('../js/map.js');


/**
 * a mock for MapView, asserts required fields
 */
function MockMapView(map) {
  assert(map.initView);
  assert(map.initZoom);
  assert(map.zoomstart);
  assert(map.zoomend);
  assert(map.dragstart);
  assert(map.user);
  assert(map.otherUsers);
};

describe('Map', function() {
  var mockOpts = {
    user: {},
    otherUsers: {},
    mapView: MockMapView
  };

  var makeMockMap = function(opts) {
    opts = opts || {};
    return new Map({
      ...mockOpts,
      ...opts
    });
  };

  it('should initialize', function() {
    assert(makeMockMap({}));
  });

  describe('toggling', function() {
    var map
    beforeEach(function() {
      map = makeMockMap({
        userLock: false,
        groupLock: true
      });
    });

    describe('toggleUserLock', function() {
      beforeEach(function() {
        map = makeMockMap({
          userLock: false,
          groupLock: true
        });
        map.toggleUserLock();
      });

      it('should toggle the user lock', function() {
        assert.equal(map.userLock, true);
      })

      it('should toggle the group lock', function() {
        assert.equal(map.groupLock, false);
      })
    });
  });
});
