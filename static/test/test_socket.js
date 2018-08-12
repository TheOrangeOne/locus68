var assert = require('assert');
var Crypt = require('../js/crypto.js');
var Socket = require('../js/socket.js');
var { User, MsgUser } = require('../js/user.js');
var { WebSocket, Server } = require('./mock-socket.min.js');


function MockCrypto(opts) {
  opts = opts || {};
  assert(opts.pass);

  this.encrypt = function(data) {
    return data;
  };

  this.decrypt = function(ct) {
    return data;
  };
};

MockCrypto.isEncryptedObj = Crypt.isEncryptedObj;

var mockOpts = {
  WebSocket: WebSocket,
  Crypto: MockCrypto,
  url: 'localhost/ws/room?id=fdasfa',
  pass: 'test'
};

describe('Socket', function() {
  describe('Socket()', function() {
    it('should initialize with mocks', function() {
      var server = new Server('wss://localhost/ws/room?id=fdasfa');
      var sock = new Socket(mockOpts);
      assert.equal(sock.status, Socket.STATE.CONNECTING);
      server.stop();
    });
  });

  describe('send', function() {
    it('should send a message', function(done) {
      var server = new Server('wss://localhost/ws/room?id=fdasfa');
      var messages = [];
      var msg = {
        type: 'test'
      };
      var sock = new Socket({
        ...mockOpts,
        onMsg: function(msg) {
          messages.push(msg);
        }
      });

      server.on('connection', socket => {
        socket.on('message', data => {
          socket.send(JSON.parse(data));
        });
      });

      setTimeout(() => {
        assert.equal(sock.status, Socket.STATE.OPEN);
        sock.send(msg);
        setTimeout(() => {
          assert.equal(messages.length, 1);
          assert.deepEqual(messages[0], msg);
          server.stop(done);
        }, 5);
      }, 5);
    });
  });
});
