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

  // the interval in which to persist to localStorage (milliseconds)
  this.PERSIST_INTERVAL = 5000;
  this.WATCHDOG_TIMEOUT = 5000;

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
};

var Config = new Configuration();

if (typeof window === 'undefined') {
  module.exports = Config;
}
