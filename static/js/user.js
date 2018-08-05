if (typeof window === 'undefined') {
  var Config = require('./conf.js');
}

/**
 * A representation of a user meant to be persisted to the
 * localStorage of a browser.
 */
function PersistUser(opts) {
  this.id = opts.id;
  this.lat = opts.lat;
  this.lng = opts.lng;
  this.img = opts.img;
  this.ts = opts.ts;
};


/**
 * TODO: abstract out this generic logic
 * A representation of a user meant to be used in messages
 * between clients.
 */
function MsgUser(opts) {
  this.attrs = {
    'id': function(x) { return typeof x === 'string'; },
    'lat': function(x) { return typeof x === 'number'; },
    'lng': function(x) { return typeof x === 'number'; },
    'img': function(x) { return typeof x === 'string'; }
  };

  for (attr in this.attrs) {
    // if the attr is not in opts, then default to the
    // value in this.attrs
    var opt = opts[attr];
    if (opt) {
      this[attr] = opt;
    }
    else {
      this[attr] = null;
    }
  }

  var self = this;

  this.isInvalid = function() {
    var invalidAttrs = [];
    for (attr in self.attrs) {
      var isValid = self.attrs[attr];
      if (!isValid(self[attr])) {
        invalidAttrs.push(attr);
      }
    }
    return invalidAttrs.length === 0 ? false : invalidAttrs;
  };
};


function User(opts) {
  opts = opts || {};
  this.id = opts.id;
  this.lat = opts.lat;
  this.lng = opts.lng;
  this.img = opts.img;
  this.ts = opts.ts; // time since last update
  this.tsls = opts.tsls; // time since last seen
  this.marker = opts.marker;

  var self = this;

  this.genId = function() {
    var id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 6);

    return id;
  };

  // update the update timestamp
  this.timestamp = function() {
    self.ts = Date.now();
    self.tsls = Date.now();
  };

  // updates lat, lng
  // returns whether values changed
  this.updateLocation = function(lat, lng) {
    var changed = (lat === self.lat) || (lng === self.lng);
    self.lat = lat;
    self.lng = lng;
    return changed;
  };

  // updates img
  // returns whether img changed
  this.updateImg = function(img) {
    var changed = img === self.img;
    self.img = img;
    return changed;
  };

  this.updateFromMsgUser = function(msgUser) {
    if (msgUser.isInvalid()) {
      console.warn('msgUser has invalid attrs ', msgUser.isInvalid());
      return false;
    }

    if (msgUser.id !== self.id) {
      console.warn('msgUser has invalid id');
      return false;
    }

    var changed;

    changed = self.updateLocation(msgUser.lat, msgUser.lng) || changed;
    changed = self.updateImg(msgUser.img) || changed;

    self.timestamp();
    return true;
  };

  this.toMsgUser = function() {
    return new MsgUser(self);
  };

  this.serialize = function() {
    var user = {
      id: self.id,
      lat: self.lat,
      lng: self.lng,
      img: self.img
    };

    return JSON.stringify(user);
  };

  this.deserialize = function(serUser) {
    var user = User.deserialize(serUser);
    // if (user) {
    // }
    // try {
    //   serUser = JSON.parse(serUser);
    //   user = new User(serUser);
    // } catch (err) {
    //   console.warn('deserializing user failed');
    //   user = new User();
    // }
    // return user;
  };

  this.init = function() {
    self.id = self.id || this.genId();
    self.lat = self.lat || null;
    self.lng = self.lng || null;
    self.img = self.img || Config.getRandomAvatar();
    self.ts = self.ts || null;
    self.tsls = self.tsls || null;
    self.marker = self.marker || null;
  };

  this.init();
};

User.deserialize = function(serUser) {
  var user;
  try {
    serUser = JSON.parse(serUser);
    user = new User(serUser);
  } catch (err) {
    console.warn('deserializing user failed');
    user = null;
  }
  return user;
};

// returns a user from a msguser
User.fromMsgUser = function(msgUser) {
  return new User(msgUser);
};

if (typeof window === 'undefined') {
  module.exports = {
    User: User,
    MsgUser: MsgUser
  };
}
