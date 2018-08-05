var assert = require('assert');
var Crypt = require('../js/crypto.js');


describe('Crypt', function() {
  describe('Crypto()', function() {
    it('should initialize properly', function() {
      var crypto = new Crypt();
      assert(crypto);
    });
  });

  var crypto;
  beforeEach(function() {
    crypto = new Crypt('mypass');
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
      var ct = crypto.encrypt(msg);
      var pt = crypto.decrypt(ct);
      assert.equal(msg, pt);
    });
  });
});
