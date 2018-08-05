var assert = require('assert');
var Config = require('../js/conf.js');
var {User, MsgUser} = require('../js/user.js');
var Users = require('../js/users.js');


describe('Users', function() {
  describe('Users()', function() {
    it('should not err out', function() {
      var users = new Users();
      assert(users);
    });
  });

  var users = new Users();
  describe('user methods', function() {
    var users;
    beforeEach(function() {
      users = new Users();
    });

    describe('getUser()', function() {
      it('should return null if user dne', function() {
        var user = users.getUser('falksjfda');
        assert.equal(user, null);
      });
    });

    describe('addUser()', function() {
      it('should add a user', function() {
        var user = new User();
        users.addUser(user);

        var gotuser = users.getUser(user.id);
        assert.equal(user, gotuser);
        assert.equal(users.list.length, 1);
      });
    });

    describe('removeUser()', function() {
      it('should remove a user', function() {
        var user = new User();
        users.addUser(user);

        users.removeUser(user.id);
        var u = users.getUser(user.id);
        assert.equal(u, null);
        assert.equal(users.list.length, 0);
      });
    });

    describe('updateFromMsgUser()', function() {
      it('should add a user from a msguser', function() {
        var msgUser = new MsgUser({
          id: 'test',
          lat: 123.12,
          lng: 432.12,
          img: '1',
        });

        users.updateFromMsgUser(msgUser);

        var user = users.getUser('test');
        assert.equal(user.id, 'test');
        assert.equal(user.lat, 123.12);
        assert.equal(user.lng, 432.12);
        assert.equal(user.img, '1');
      });
    });
  });
});
