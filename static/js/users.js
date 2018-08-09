if (typeof window === 'undefined') {
  var Config = require('./conf.js'),
    Lib = require('./lib.js'),
    User = require('./user.js').User,
    MsgUser = require('./user.js').MsgUser
}


function Users(opts) {
  opts = opts || {};

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
    return self.users.length;
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

  this.addFromMsgUser = function(msgUser) {
    var user = User.fromMsgUser(msgUser);
    self.addUser(user);
  };

  // if a user with the same id as msgUser then update it,
  // else create a new use from msgUser
  this.updateFromMsgUser = function(msgUser) {
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
      self.addFromMsgUser(msgUser);
      return Users.NEW;
    }
  };

  // updates a stored user given a msgUser
  this.updateUser = function(msgUser) {
    var user = self.getUser(msgUser.id);
  };

  this.serialize = function() {
    var state = {};
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
  var users = new Users();
  for (userId in serUsers) {
    serUser = serUsers[userId];
    user = User.deserialize(serUser);
    users.addUser(user);
  }

  return users;
};



if (typeof window === 'undefined') {
  module.exports = Users;
}
