var assert = require('assert');
var Config = require('../js/conf.js');


describe('Config', function() {
  describe('getAvatarURL', function() {
    it('should return a valid avatar url', function() {
      var url = Config.getAvatarURL(1);
      assert.equal(url, '/static/img/rand/1.png');
    });
  });

  describe('isInvalidPass', function() {
    it('should not allow empty passwords', function() {
      assert.equal(Config.isInvalidPass(''), 'must not be empty');
    });

    it('should not allow short passwords', function() {
      assert.equal(Config.isInvalidPass('1234'), 'must be at least 6 characters');
    });

    it('should allow reasonable passwords', function() {
      var pass = 'kfdlajfdkjsalfk';
      assert.equal(Config.isInvalidPass(pass), false);
    });
  });
});
