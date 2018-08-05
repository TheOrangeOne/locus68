var assert = require('assert');
var Config = require('../js/conf.js');
var {User, MsgUser} = require('../js/user.js');


describe('User', function() {
  describe('initialization', function() {
    describe('User()', function() {
      it('should not err out', function() {
        var user = new User();
        assert(user);
      });
    });

    describe('init', function() {
      it('should not err out', function() {
        var user = new User();
        user.init();
        assert(user);
      });

      it('should assign a new user id', function() {
        var user = new User();
        user.init();
        assert(user.id);
      });
    });
  });

  describe('mutation', function() {
    var user;
    beforeEach(function() {
      user = new User();
    });

    describe('updateFromMsgUser', function() {
      it('should not update if id does not match user', function() {
        var before = {
          id: user.id,
          lat: user.lat,
          lng: user.lng,
          img: user.img
        };

        var msgUser = new MsgUser({
          id: 'nottheid',
          lat: 1.1,
          lng: 2.2,
          img: '1',
        });

        ret = user.updateFromMsgUser(msgUser);
        assert.equal(ret, false);
        assert.equal(user.lat, before.lat);
        assert.equal(user.lng, before.lng);
        assert.equal(user.img, before.img);
      });

      it('should update the lat, lng, img of the user', function() {
        var msgUser = new MsgUser({
          id: user.id,
          lat: 1.1,
          lng: 2.2,
          img: '1',
        });

        ret = user.updateFromMsgUser(msgUser);
        assert.equal(ret, true);

        assert.equal(user.lat, 1.1);
        assert.equal(user.lng, 2.2);
        assert.equal(user.img, '1');
      });
    });

    describe('toMsgUser', function() {
      it('should return a valid msguser', function() {
        var msgUser = user.toMsgUser();

        assert(msgUser.isInvalid());
        assert.equal(msgUser.id, user.id);
        assert.equal(msgUser.lat, user.lat);
        assert.equal(msgUser.lng, user.lng);
        assert.equal(msgUser.img, user.img);
      });
    });
  });

  describe('serialization', function() {
    var user;
    beforeEach(function() {
      user = new User();
      user.init();
    });

    describe('serialize', function() {
      it('should not err out on a new user', function() {
        var suser = user.serialize();
        assert(suser);
      });
    });

    describe('deserialize (static)', function() {
      it('should fail gracefully', function() {
        var suser = "fasfljdkafkjas";
        var postUser = User.deserialize(suser);
        assert.equal(postUser, null);
      });

      it('should deserialize a serialized user', function() {
        var preUser = new User({
          id: "12345",
          lat: 31.212131,
          lng: 12.321321,
          img: '10'
        });

        var suser = preUser.serialize();

        var postUser = User.deserialize(suser);
        assert.equal(postUser.id, preUser.id);
        assert.equal(postUser.lat, preUser.lat);
        assert.equal(postUser.lng, preUser.lng);
        assert.equal(postUser.img, preUser.img);
      });
    });

    describe('deserialize (static)', function() {
      it('should deserialize a serialized user', function() {
        var preUser = new User({
          id: "12345",
          lat: 31.212131,
          lng: 12.321321,
          img: '10'
        });

        var suser = preUser.serialize();
        assert(suser);

        var postUser = new User();
        var postUser = postUser.deserialize(suser);
        var test = User.deserialize(suser);
      });
    });
  });

  describe('fromMsgUser', function() {
    it('should return a user for a msguser', function() {
      var msgUser = new MsgUser({
        id: 'test',
        lat: 123.12,
        lng: 432.12,
        img: '2',
      });
      var user = User.fromMsgUser(msgUser);

      assert.equal(user.id, 'test');
      assert.equal(user.lat, 123.12);
      assert.equal(user.lng, 432.12);
      assert.equal(user.img, '2');
    });
  });
});
