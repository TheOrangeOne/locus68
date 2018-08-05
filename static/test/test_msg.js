var assert = require('assert');
var Config = require('../js/conf.js');
var {User, MsgUser} = require('../js/user.js');
var Msgr = require('../js/msg.js');


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

  assert(opts.url);

  this.send = function(data) {
    assert(data);
  };
};


describe('Msgr', function() {
  describe('Msgr()', function() {
    it('should intialize with mocks', function() {
      var msg = new Msgr({
        crypto: MockCrypto,
        socket: MockSocket,
        url: 'localhost/ws/room?id=fdasfa',
        pass: 'test'
      });
    });
  });

  var msgr;
  beforeEach(function() {
    msgr = new Msgr({
      crypto: MockCrypto,
      socket: MockSocket,
      url: 'localhost/ws/room?id=fdasfa',
      pass: 'test'
    });
  });

  describe('sendMsg', function() {
    it('should send a message', function() {
      msgr.sendMsg("mymessage");
    });
  });
});
