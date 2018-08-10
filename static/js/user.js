if (typeof window === 'undefined') {
  var Config = require('./conf.js');
}


/**
 * A representation of a user meant to be used in messages
 * between clients.
 * TODO: abstract out this generic logic
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
  this.act = opts.act || false; // if the user is active or not
  this.tslsEnabled = opts.tslsEnabled || false;
  this.tsls = null;
  this.onTimeout = opts.onTimeout || function(user) {
    return false;
  };

  var self = this;

  this.genId = function() {
    var id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 6);

    return id;
  };

  // returns whether this user's data is valid
  this.isReady = function() {
    return !!(self.lat && self.lng && self.img);
  };

  this.timeSinceLastUpdate = function() {
    return Date.now() - self.ts;
  };

  this.isActive = function() {
    return self.act;
  };

  this.setInactive = function() {
    self.act = false;
  };

  this.setActive = function(update) {
    update = update || false;
    self.act = true;
    if (update) {
      self.timestamp();
    }
  };

  // update the update timestamp
  this.timestamp = function() {
    self.ts = Date.now();
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
    var changed = img !== self.img;
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

    self.setActive(true);
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
      img: self.img,
      ts: self.ts,
      tslsEnabled: self.tslsEnabled
    };

    return user;
  };

  this.updateTSLS = function() {
    if (self.ts) {
      self.tsls = Date.now() - self.ts;

      if (!self.isActive() && self.tsls > User.TIMEOUT_THRESHOLD) {
        // onTimeout must return true for us to disable the timeout
        if (self.onTimeout(self)) {
          self.tslsEnabled = false;
        }
      }
    }
    if (self.tslsEnabled) {
      setTimeout(self.updateTSLS, 15000);
    }
  };

  this.init = function() {
    self.id = self.id || this.genId();
    self.lat = self.lat || null;
    self.lng = self.lng || null;
    self.img = self.img || Config.getRandomAvatar();
    self.ts = self.ts || null;
    self.updateTSLS();
  };

  this.init();
};


// threshold in when the user should be removed completely
User.TIMEOUT_THRESHOLD = 60*60*1000; // 60*60*1000; // 60 minutes

User.deserialize = function(serUser) {
  var user;
  try {
    if (typeof serUser !== 'object') {
      console.warn('deserializing user failed');
      return null;
    }
    user = new User(serUser);
  } catch (err) {
    console.warn('deserializing user failed');
    user = null;
  }
  return user;
};

if (typeof window === 'undefined') {
  module.exports = {
    User: User,
    MsgUser: MsgUser
  };
}
