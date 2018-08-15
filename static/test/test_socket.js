var assert = require('assert');
var Crypt = require('../js/crypto.js');
var Socket = require('../js/socket.js');
var { User, MsgUser } = require('../js/user.js');
var { WebSocket, Server } = require('./mock-socket.min.js');


function NoopWebSocket(opts) {};

function ErrorWebSocket(opts) {
  throw new Error('ERR connection refused');
};

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
  url: 'localhost/ws/mockRoom?id=mockUserId',
  pass: 'test',
  secure: true,
};

describe('Socket', function() {
  describe('Socket()', function() {
    it('should initialize with mocks', function() {
      var server = new Server('wss://localhost/ws/room?id=fdasfa');
      var sock = new Socket(mockOpts);
      assert.equal(sock.status, Socket.STATE.CONNECTING);
      server.stop();
    });

    it('should not error out on failure', function() {
      var sock = new Socket({
        ...mockOpts,
        WebSocket: ErrorWebSocket
      });
      assert.equal(sock.status, Socket.STATE.CLOSED);
    });
  });

  describe('getURL', () => {
    it('should return the correct secure address', () => {
      const sock = new Socket({
        ...mockOpts,
        WebSocket: NoopWebSocket,
        url: 'localhost/ws/asdf',
        secure: true,
      });

      assert.equal(sock.getURL(), 'wss://localhost/ws/asdf');
    });

    it('should return the correct insecure address', () => {
      const sock = new Socket({
        ...mockOpts,
        WebSocket: NoopWebSocket,
        url: 'localhost/ws/asdf',
        secure: false,
      });

      assert.equal(sock.getURL(), 'ws://localhost/ws/asdf');
    });
  });

  describe('send', function() {
    it('should send a message', function(done) {
      var server = new Server('wss://localhost/ws/mockRoom?id=mockUserId');
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
        }, 15);
      }, 15);
    });
  });

  describe('reconnect', function() {
    it('should noop when the status open or connecting', () => {
      var sock = new Socket({
        ...mockOpts,
        WebSocket: NoopWebSocket,
        onMsg: function(msg) {
          messages.push(msg);
        }
      });

      sock.status = Socket.STATE.OPEN;
      sock.reconnect()
      assert.equal(sock.status, Socket.STATE.OPEN);

      sock.status = Socket.STATE.CONNECTING;
      sock.reconnect()
      assert.equal(sock.status, Socket.STATE.CONNECTING);
    });

    it('should reinit when the status is closed', () => {
      var count = 0;

      // increment count so we can confirm it was run
      // also throw an error to make the socket status
      // Socket.STATE.CLOSED
      function TestSocket(url) {
        count += 1;
        throw new Error('test');
      };

      var sock = new Socket({
        ...mockOpts,
        WebSocket: TestSocket,
        onMsg: function(msg) {
          messages.push(msg);
        }
      });

      assert.equal(count, 1);
      assert.equal(sock.status, 3);

      sock.reconnect();
      assert.equal(count, 2);
      assert.equal(sock.status, 3);
    });
  });
});
