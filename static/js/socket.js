if (typeof window === 'undefined') {
  var WebSocket = require('../test/mock-socket.min.js').WebSocket
}

/**
 * Socket wraps WebSocket and provides encryption
 */
function Socket(opts) {
  opts = opts || {};
  this.proto = opts.secure ? 'wss' : 'ws';
  this.url = opts.url || null;
  this.pass = opts.pass || null;
  this.onMsg = opts.onMsg || function(ev) {};
  this.onOpen = opts.onOpen || function(ev) {};
  this.onClose = opts.onClose || function(ev) {};
  this.onError = opts.onError || function(ev) {};
  this.WebSocket = opts.WebSocket || window.WebSocket;
  this.conn = null;
  this.Crypto = opts.Crypto || Crypt;
  this.crypto = null;
  this.status = Socket.STATE.CONNECTING;

  this.onopen = function(evt) {
    self.status = Socket.STATE.OPEN;
    self.onOpen(evt);
  };

  this.onmessage = function(evt) {
    var data = evt.data;
    var ct = JSON.parse(data);
    var msg;
    if (self.Crypto.isEncryptedObj(ct)) {
      msg = self.crypto.decrypt(ct);
      msg = JSON.parse(msg);
    }
    else {
      msg = ct;
    }
    self.onMsg(msg);
  };

  this.onclose = function(ev) {
    self.status = Socket.STATE.CLOSED;
    self.onClose(ev);
  };

  this.onError = opts.onerror || function(evt) {
    console.log('websocket error!', evt);
  };

  var self = this;

  // returns whether the socket is ready to communicate
  this.isReady = function() {
    if (!self.conn) return Socket.STATE.CLOSED;
    return self.conn.readyState === Socket.STATE.OPEN;
  };

  this.send = function(msg) {
    if (!self.conn) {
      return false;
    }
    if (self.conn.readyState !== Socket.STATE.OPEN) {
      return false;
    }
    var smsg = JSON.stringify(msg);
    var cmsg = self.crypto.encrypt(smsg);
    cmsg = JSON.stringify(cmsg);
    self.conn.send(cmsg);
  };

  this.getURL = function() {
    return self.proto + '://' + self.url;
  };

  this.reconnect = function() {
    var status;
    if (self.conn) {
      status = self.conn.readyState;
    }
    status = Socket.STATE.CLOSED;

    if (status !== Socket.STATE.OPEN &&
        status !== Socket.STATE.CONNECTING) {
      self.init();
    }
  };

  this.init = function() {
    self.crypto = new self.Crypto({
      pass: self.pass
    });

    if (!self.WebSocket) {
      // TODO: appropriate error
      console.error('browser does not support websockets');
      return false;
    }

    var conn;

    try {
      conn = new self.WebSocket(self.getURL());
      conn.onopen = self.onopen;
      conn.onmessage = self.onmessage;
      conn.onclose = self.onclose;
      conn.onerror = self.onerror;
    } catch (e) {
      // TODO: some better indication of failure to the user
      self.status = Socket.STATE.CLOSED;
      conn = null;
    }

    // set the connection
    self.conn = conn;
  };

  this.init();
};

// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
Socket.STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

if (typeof window === 'undefined') {
  module.exports = Socket;
}
