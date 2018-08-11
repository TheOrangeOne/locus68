/**
 * Socket wraps websocket
 */
function Socket(opts) {
  opts = opts || {};

  this.proto = opts.proto || 'wss';
  this.url = opts.url || null;
  this.onopen = opts.onopen || function(evt) {
    console.log('socket opened');
  };
  this.onclose = opts.onclose || function(evt) {
    console.log('socket closed');
  };
  this.onmessage = opts.onmessage || function(evt) {
    console.log('message received:', evt.data);
  };
  this.conn = null;

  var self = this;

  // returns whether the socket is ready to communicate
  this.isReady = function() {
    return self.conn.readyState === Socket.WS_STATE.OPEN;
  };

  this.send = function(msg) {
    if (!self.conn) {
      return false;
    }
    if (conn.readyState !== Socket.WS_STATE.OPEN) {
      return false;
    }
    self.conn.send(msg);
  };

  this.getURL = function() {
    return self.proto + '://' + self.url;
  };

  this.init = function() {
    if (!window['WebSocket']) {
      // TODO: appropriate error
      console.error('browser does not support websockets');
      return false;
    }
    conn = new WebSocket(self.getURL());

    conn.onopen = self.onopen;
    conn.onclose = self.onclose;
    conn.onmessage = self.onmessage;

    // set the connection
    self.conn = conn;
  };

  this.init();
};

// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
Socket.WS_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

if (typeof window === 'undefined') {
  module.exports = Socket;
}
