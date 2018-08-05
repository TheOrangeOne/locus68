if (typeof window === 'undefined') {
  var Crypt = require('./crypto.js'),
    Socket = require('./socket.js')
}

/**
 * Given a crypto scheme and a socket, will handle sending
 * and receiving data.
 */
function Msgr(opts) {
  opts = opts || {};
  this.url = opts.url || null;
  this.proto = opts.proto || null;
  this.pass = opts.pass || null;
  this.onMsg = opts.onMsg || function() {};
  this.onopen = opts.onopen || null;
  this.onclose = opts.onclose || null;

  this.Socket = opts.socket || Socket;
  this.Crypt = opts.crypto || Crypt;

  var self = this;

  // sends a msg that is JSON.stringify-able
  this.sendMsg = function(msg) {
    var smsg = JSON.stringify(msg);
    var cmsg = self.crypto.encrypt(smsg);
    cmsg = JSON.stringify(cmsg);
    self.socket.send(cmsg);
  };

  this.onmessage = function(evt) {
    var data = evt.data;
    var ct = JSON.parse(data);
    var msg = self.crypto.decrypt(ct);
    self.onMsg(msg);
  };

  this.init = function() {
    self.socket = new self.Socket({
      proto: self.proto,
      url: self.url,
      onmessage: self.onmessage,
      onopen: self.onopen,
      onclose: self.onclose
    });

    self.crypto = new self.Crypt({
      pass: self.pass
    });
  };

  this.init();
};

if (typeof window === 'undefined') {
  module.exports = Msgr;
}
