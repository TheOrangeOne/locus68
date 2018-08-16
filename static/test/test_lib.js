var assert = require('assert');
var Lib = require('../js/lib.js');


describe('Lib', function() {
  describe('prettyTime', function() {
    it('should return \'?\' if the time is not a number', function() {
      var time = false;
      assert.equal(Lib.prettyTime(time), '?');
      time = null;
      assert.equal(Lib.prettyTime(time), '?');
      time = -1;
      assert.equal(Lib.prettyTime(time), '?');
    });

    it('should work is the time is 0', function() {
      var time = 0;
      assert.equal(Lib.prettyTime(time), '0s');
    });

    it('should return the time in seconds if <1m', function() {
      var time = 5*1000;
      assert.equal(Lib.prettyTime(time), '5s');
      time = 35*1000;
      assert.equal(Lib.prettyTime(time), '35s');
    });

    it('should return the time in minutes if >=1m', function() {
      var time = 60*1000;
      assert.equal(Lib.prettyTime(time), '1m');
    });

    it('should return the time in hours if >=1h', function() {
      var time = 60*60*1000;
      assert.equal(Lib.prettyTime(time), '1h');
      time = 90*60*60*1000;
      assert.equal(Lib.prettyTime(time), '90h');
    });

    it('should return \'∞\' if it\'s been a long time', function() {
      var time = 100*60*60*1000;
      assert.equal(Lib.prettyTime(time), '∞');
    });
  });

  describe('prettyRoomName', function() {
    it('should truncate a room name if it is long', function() {
      var name = 'myverylongroomnameisverylong';
      assert.equal(Lib.prettyRoomName(name, 6), 'myvery...');
    });

    it('should truncate a room name if it is long', function() {
      var name = 'myverylongroomnameisverylong';
      assert.equal(Lib.prettyRoomName(name, 13), 'myverylongroo...');
    });
  });

  describe('isProd', function() {
    it('should be true for localhost', function() {
      assert(Lib.isProd('localhost:8080'));
    });
    it('should be false for something random', function() {
      assert(!Lib.isProd('whatintheworld'));
    });
  });
});
