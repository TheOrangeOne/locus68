

/**
 * Socket wraps websocket
 */
function Socket() {
};

if (typeof window === 'undefined') {
  module.exports = Socket;
}
