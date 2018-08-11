function Configuration() {
  this.NUM_AVATARS = 25;

  this.AVATARS = [];
  for (var i = 1; i < this.NUM_AVATARS + 1; ++i) {
    this.AVATARS.push(i);
  }

  this.ASSET_PATH = '/static/';
  this.IMG_PATH = this.ASSET_PATH + 'img/';
  this.DEFAULT_AVATAR = this.IMG_PATH + '/def.png';
  this.AVATAR_PATH = this.IMG_PATH + 'rand/';
  this.ICON_SIZE = 42; // '0.5em';

  this.GEO_CONFIG = {
    enableHighAccuracy: true,
    timeout: 60000,  // wait 1m for location
    maximumAge: 0  // fetch latest location
  };

  // the interval in which to persist to localStorage (milliseconds)
  this.PERSIST_INTERVAL = 5000;
  this.WATCHDOG_TIMEOUT = 15000;

  // number of seconds in which to keep what is stored in localStorage
  this.CACHE_LIFETIME = 600;

  // the time in which to auto rejoin the user if they land on the index page
  this.AUTO_REJOIN = 300;

  this.UPDATE_INTERVAL = 10000;

  /* message protocol
   *
   * a message looks like
   * msg = {
   *   user: USER_ID,
   *   type: MSG_TYPE,
   *   data: MSG_DATA,
   * }
   */
  this.MSG_TYPE = {
    USER_UPDATE: 'userup',    // general update for a user
    USER_CONNECT: 'userco',  // user connected
    USER_DISCONNECT: 'userdc'  // user disconnected
  };

  var self = this;

  this.getAvatarURL = function(num) {
    return self.AVATAR_PATH + num + '.png';
  };

  this.getRandomAvatar = function() {
    var randint = Math.floor((Math.random()*25)+1);
    return self.getAvatarURL(randint);
  };

  this.MIN_PASS_LENGTH = 6;

  // to add a password validation rule add an object with
  // a test function and a failure reason
  this.PASS_VALIDATORS = [
    {
      test: function(pass) {
        return pass && typeof pass === 'string';
      },
      reason: 'must not be empty'
    },
    {
      test: function(pass) {
        return pass.length > self.MIN_PASS_LENGTH;
      },
      reason: 'must be at least ' + self.MIN_PASS_LENGTH + ' characters'
    }
  ];

  // returns an error message if a password is invalid
  // else false
  this.isInvalidPass = function(pass) {
    var i, validator, test;
    for (i = 0; i < self.PASS_VALIDATORS.length; ++i) {
      validator = self.PASS_VALIDATORS[i];
      if (!validator.test(pass)) {
        return validator.reason;
      }
    }
    return false;
  };
};

var Config = new Configuration();

if (typeof window === 'undefined') {
  module.exports = Config;
}
