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
  this.onOpen = opts.onopen || null;
  this.onClose = opts.onclose || null;

  this.Socket = opts.socket || Socket;
  this.Crypt = opts.crypto || Crypt;
  this.status = Msgr.STATUS.UNINIT;

  var self = this;

  // returns whether this Msgr is ready to communicate
  this.isReady = function() {
    return self.socket.isReady();
  };

  this.onopen = function(ev) {
    self.status = Msgr.STATUS.CONN;
    self.onOpen(ev);
  };

  this.onclose = function(ev) {
    self.status = Msgr.STATUS.DCONN;
    self.onClose(ev);
  };

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
    var msg;
    if (self.Crypt.isEncryptedObj(ct)) {
      msg = self.crypto.decrypt(ct);
      msg = JSON.parse(msg);
    }
    else {
      msg = ct;
    }
    self.onMsg(msg);
  };

  this.reconnect = function() {
    if (self.status !== Msgr.STATUS.RCONN &&
        self.status !== Msgr.STATUS.CONN) {
      self.status = Msgr.STATUS.RCONN;
      self.initSocket();
    }
  };

  this.initSocket = function() {
    self.socket = new self.Socket({
      proto: self.proto,
      url: self.url,
      onmessage: self.onmessage,
      onopen: self.onopen,
      onclose: self.onclose
    });
  };

  this.init = function() {
    self.initSocket();

    self.crypto = new self.Crypt({
      pass: self.pass
    });
  };

  this.init();
};

Msgr.STATUS = {
  UNINIT: -1,
  CONN: 0,
  DCONN: 1,
  RCONN: 2
};

if (typeof window === 'undefined') {
  module.exports = Msgr;
}
