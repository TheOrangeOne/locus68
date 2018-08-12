var assert = require('assert');
var Config = require('../js/conf.js');
var Socket = require('../js/socket.js');
var { User, MsgUser } = require('../js/user.js');
var Msgr = require('../js/msg.js');
var { WebSocket } = require('./mock-socket');


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

function MockSocket(opts) {
  opts = opts || {};
  this.conn = {};

  this.conn.readyState = Socket.WS_STATE.CONNECTING;
  assert(opts.url);

  var self = this;

  this.send = function(data) {
    assert(data);
  };
};

var mockOpts = {
  crypto: MockCrypto,
  socket: MockSocket,
  url: 'localhost/ws/room?id=fdasfa',
  pass: 'test'
};

describe('Msgr', function() {
  describe('Msgr()', function() {
    it('should intialize with mocks', function() {
      var msg = new Msgr(mockOpts);
      assert.equal(msg.status, Msgr.STATUS.UNINIT);
    });
  });

  var msgr;
  beforeEach(function() {
    msgr = new Msgr(mockOpts);
  });

  describe('sendMsg', function() {
    it('should send a message', function() {
      msgr.sendMsg('mymessage');
    });
  });
});
