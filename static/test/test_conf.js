var assert = require('assert');
var Config = require('../js/conf.js');


describe('Config', function() {
  describe('getAvatarURL', function() {
    it('should return a valid avatar url', function() {
      var url = Config.getAvatarURL(1);
      assert(url == '/static/img/rand/1.png');
    });
  });
});
