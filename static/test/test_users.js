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

        // should add the user
        users.updateFromMsgUser(msgUser);

        var user = users.getUser('test');
        assert.equal(user.id, 'test');
        assert.equal(user.lat, 123.12);
        assert.equal(user.lng, 432.12);
        assert.equal(user.img, '1');

        msgUser.lat = 124.12;
        msgUser.lng = 433.12;
        msgUser.img = '2';

        // should update the user
        users.updateFromMsgUser(msgUser);
        assert.equal(user.id, 'test');
        assert.equal(user.lat, 124.12);
        assert.equal(user.lng, 433.12);
        assert.equal(user.img, '2');
      });
    });

    describe('serialization', function() {
      var users;
      var testUser1;
      var testUser2;
      beforeEach(function() {
        users = new Users();
        testUser1 = new User({
          id: '1234',
          lat: 1.2,
          lng: 3.2,
          img: '3'
        });
        testUser2 = new User({
          id: '9876',
          lat: 2.2,
          lng: 4.2,
          img: '2'
        });

        users.addUser(testUser1);
        users.addUser(testUser2);
      });

      describe('serialize()', function() {
        it('should successfully serialize', function() {
          var serUsers = users.serialize();
          assert(serUsers);
        });

        it('should successfully deserialize', function() {
          var serUsers = users.serialize();

          var postUsers = Users.deserialize(serUsers);

          assert(postUsers.hasUser(testUser1.id));
          assert(postUsers.hasUser(testUser2.id));
          var postUser1 = postUsers.getUser(testUser1.id);
          var postUser2 = postUsers.getUser(testUser2.id);

          assert.equal(postUser1.id, testUser1.id);
          assert.equal(postUser2.id, testUser2.id);
          assert.equal(postUser1.lat, testUser1.lat);
          assert.equal(postUser2.lat, testUser2.lat);
          assert.equal(postUser1.lng, testUser1.lng);
          assert.equal(postUser2.lng, testUser2.lng);
        });
      });
    });
  });
});
