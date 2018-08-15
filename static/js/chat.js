

function Chat(opts) {
  opts = opts || {};
  this.onAdd = opts.onAdd || function (user, message) {}

  this.messages = [];

  var self = this;


  // add a new message to the chat
  this.add = function(user, message) {
    message.ts = message.ts || Date.now();
    self.messages.push({
      img: user.img,
      ts: message.ts,
      text: message.text
    });

    this.onAdd(user, message);
  };

  this.serialize = function() {
  };

  this.init = function() {
  };

  this.init();
};

Chat.deserialize = function(serChat) {
};


if (typeof window === 'undefined') {
  module.exports = Chat;
}
