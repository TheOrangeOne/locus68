
/**
 * Socket wraps websocket
 */
function Socket(opts) {
  opts = opts || {};

  this.protocol = opts.protocol || 'wss';
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

  this.send = function(msg) {
    var payload;
    if (!self.conn) {
      return false;
    }
    if (!conn.readyState === Socket.WS_STATE.OPEN) {
      return false;
    }
    self.conn.send(payload);
  };

  this.init = function() {
    if (!window['WebSocket']) {
      // TODO: appropriate error
      console.error('browser does not support websockets');
      return false;
    }
    conn = new WebSocket(self.url);

    conn.onopen = self.onopen;
    conn.onclose = self.onclose;
    conn.onmessage = self.onmessage;

    // set the connection
    self.conn = conn;
  };
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
