if (typeof window === 'undefined') {
  Config = require('./conf.js');
  Lib = require('./lib.js');
}

/**
 * Given a crypto scheme and a socket, will handle sending
 * and receiving data.
 */
function Msgr(opts) {
  opts = opts || {};
  this.socket = opts.socket || null;
  this.crypto = opts.crypto || null;
  var self = this;

  // sends a msg that is JSON.stringify-able
  this.send = function(msg) {
  };
};

if (typeof window === 'undefined') {
  module.exports = Msgr;
}
