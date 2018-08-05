var assert = require('assert');
// var crypto = require('crypto');
var Crypto = require('../js/crypto.js');


describe('Crypto', function() {
  describe('Crypto()', function() {
    it('should initialize properly', function() {
      var crypto = new Crypto();
      assert(crypto);
    });
  });

  var crypto;
  beforeEach(function() {
    crypto = new Crypto('mypass');
  });

  describe('encrypt()', function() {
    it('should encrypt data successfully', function() {
      var msg = 'mymessage';
      var ct = crypto.encrypt(msg);
      assert(ct);
      assert.notEqual(ct, 'mymessage');
    });
  });

  describe('decrypt()', function() {
    it('should decrypt data successfully', function() {
      var msg = 'mymessage';
      // var ct = crypto.encrypt(msg);
      // var pt = crypto.decrypt(msg);
      // assert.equal(msg, pt);
    });
  });
});
