var assert = require('assert');
var Locus = require('../js/locus.js');


describe('Locus', function() {
  describe('Locus()', function() {
    it('should initialize properly', function() {
      var locus = new Locus({
        roomName: 'testroom'
      });
    });
  });

  describe('initialization', function() {
    it('should initialize properly', function() {
      // obtain room information successfully
      var locus = new Locus({
        roomName: 'testroom'
      });

      // locus.initStart();
      // // obtain socket connection successfully...
      // locus.initMsgr()
      // // obtain location info successfully...
      // locus.initMap()
    });
  });

  describe('getRoomName', function() {
    it('should initialize properly', function() {
      // var locus = new Locus();
    });
  });

  describe('validPass', function() {
    it('should not permit empty passwords', function() {
      assert.equal(Locus.isInvalidPass(''), 'must not be empty');
      assert.equal(Locus.isInvalidPass('1234'), 'must be at least 6 characters');
    });
  });
});
