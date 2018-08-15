if (typeof window === 'undefined') {
  var Config = require('./conf.js'),
    Lib = require('./lib.js'),
    User = require('./user.js').User,
    MsgUser = require('./user.js').MsgUser
}


function Users(opts) {
  opts = opts || {};
  this.tslsEnabled = opts.tslsEnabled || false; // enable tsls for users

  this.users = {};

  // vuejs doesn't support reactive changes to objects so
  // we have to maintain a list of the users as well
  this.list = [];

  var self = this;

  // returns if a user is stored
  this.hasUser = function(userId) {
    return userId in self.users;
  };

  // returns a user given a userid, null if the user dne
  this.getUser = function(userId) {
    if (userId in self.users) {
      return self.users[userId];
    }
    return null;
  };

  // returns the number of users stored
  this.numUsers = function() {
    return self.list.length;
  };

  this.addUser = function(user) {
    if (user.id in self.users) {
      console.warn('user exists, overwriting');
    }

    self.users[user.id] = user;
    self.list.push(user);
  };

  this.removeUser = function(userId) {
    if (self.hasUser(userId)) {
      var user = self.getUser(userId);
      var index = self.list.indexOf(user);
      if (index !== -1)
        self.list.splice(index, 1);
      delete self.users[userId];
    }
    else {
      console.warn('remove: user dne');
    }
  };

  this.onUserTimeout = function(user) {
    self.removeUser(user.id);
    return true;
  };

  this.addFromMsgUser = function(msgUser) {
    msgUser.tslsEnabled = self.tslsEnabled;
    msgUser.onTimeout = self.onUserTimeout;
    var user = new User(msgUser);
    self.addUser(user);
  };

  // if a user with the same id as msgUser then update it,
  // else create a new use from msgUser
  this.updateFromMsgUser = function(msgUser, update) {
    if (msgUser.isInvalid()) {
      console.warn('msgUser invalid attrs: ', msgUser.isInvalid());
      return false;
    }

    if (self.hasUser(msgUser.id)) {
      var user = self.getUser(msgUser.id);
      user.updateFromMsgUser(msgUser);
      return Users.UPDATE;
    }
    else {
      self.addFromMsgUser(msgUser, update);
      return Users.NEW;
    }
  };

  this.setInactive = function(userId) {
    var user = self.getUser(userId);
    user.setInactive();
  };

  this.setActive = function(userId) {
    var user = self.getUser(userId);
    user.setActive();
  };

  this.serialize = function() {
    var state = {
      tslsEnabled: self.tslsEnabled
    };
    var user, userId, serUser;
    for (userId in self.users) {
      user = self.getUser(userId);
      serUser = user.serialize();
      state[userId] = serUser;
    }
    return state;
  };
};

Users.NEW = 0;
Users.UPDATE = 1;

Users.deserialize = function(serUsers) {
  var serUser, user;
  var users = new Users({
    tslsEnabled: serUsers.tslsEnabled
  });
  delete serUsers.tslsEnabled;

  for (userId in serUsers) {
    serUser = serUsers[userId];
    user = User.deserialize(serUser);
    user.onTimeout = users.onUserTimeout;
    users.addUser(user);
  }

  return users;
};



if (typeof window === 'undefined') {
  module.exports = Users;
}
