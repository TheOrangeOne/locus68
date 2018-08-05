if (typeof window === 'undefined') {
  Config = require('./conf.js');
  Lib = require('./lib.js');
  User = require('./user.js').User;
  Users = require('./users.js');
}

/**
 * The main application.
 */
function Locus(opts) {
  opts = opts || {};

  this.user = new User();
  this.otherUsers = new Users();
  var self = this;

};


if (typeof window === 'undefined') {
  module.exports = Locus;
}
