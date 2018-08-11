
function Init() {};

/**
 *
 */
Init.webSocket = function(locus, iopts, next) {
  var room = locus.roomName;
  var ellip = room.length > 16 ? '...' : '';
  var sroom = room.substr(0, 16) + ellip;
  iopts.log.push({
    type: 'info',
    msg: 'connecting to room ' + sroom
  });

  locus.initStart();

  // not sure if this is the best approach
  // we could also have this wait logic implemented on send
  var waitForMsgr = function() {
    setTimeout(function() {
      if (!locus.msgr.isReady()) {
        iopts.log.push({ type: 'info', msg: 'connecting...' });
        waitForMsgr();
      }
      else {
        iopts.log.push({ type: 'info', msg: 'connected!' });
        next(locus, iopts);
      }
    }, 500);
  };

  waitForMsgr(locus, next);
};

/**
 *
 */
Init.location = function(locus, iopts, next) {
  iopts.log.push({
    type: 'info',
    msg: 'getting location'
  });
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        iopts.log.push({
          type: 'info',
          msg: 'got location!'
        });
        locus.initLocation(pos);
        next(locus, iopts);
      },
      function(err) {
        iopts.log.push({
          type: 'error',
          msg: 'failed to get location!'
        });
      }, {
        enableHighAccuracy: true,
        timeout: 15000,  // wait 15s for location
        maximumAge: 0  // fetch latest location
      }
    )
  }
  else {
    iopts.log.push({
      type: 'error',
      msg: 'failed to get location!'
    });
  }
};

/**
 * determines required room information
 * for a regular room:
 *  - the room name
 * for a secure room:
 *  - the room password
 *  - the room name
 * only on success will initRoom move on to next()
 */
Init.room = function(opts, next) {
  opts = opts || {};
  var path = opts.path;

  opts.initopts.log.push({
    type: 'info',
    msg: 'initializing room'
  });

  if (path.substr(0, 3) === '/r/') {
    opts.roomName = path.substr(3, path.length);
    next(opts);
  }
  else if (path === '/x' || path == '/x/') {
    opts.initopts.roomKeyEnabled = true;
    opts.initopts.roomKeyVisible = true;

    // run on submit of room key
    opts.initopts.roomKeySubmit = function(e) {
      var val = e.target.value;
      if (!Config.isInvalidPass(val)) {
        opts.initopts.roomKeyEnabled = false;
        opts.initopts.roomKeyVisible = false;
        opts.pass = e.target.value;
        opts.roomName = Crypt.hash(opts.pass).toHex();
        next(opts);
      } else {
        opts.initopts.log.push({
          type: 'warn',
          msg: 'key ' + Config.isInvalidPass(val)
        });
      }
    };
  } else {
    // backend should prevent us from ever getting here
    opts.initopts.log.push({
      type: 'error',
      msg: 'invalid route specified'
    });
  }
};


/**
 * Attempts to restore state from localStorage
 */
Init.restore = function(opts, next) {
  opts = opts || {};
  opts.initopts.log.push({
    type: 'info',
    msg: 'checking for saved data'
  });

  var serState = localStorage.getItem(opts.roomName) || {};
  try {
    serState = JSON.parse(serState);
    console.log(serState);
    state = Locus.deserialize(serState);

    // copy the deserialized state into opts
    for (item in state) {
      opts[item] = state[item];
    }
  } catch(e) {
    opts.initopts.log.push({
      type: 'error',
      msg: 'failed to restore state'
    });
  }

  console.log(opts);
  // create and return a locus instance from the opts
  var locus = new Locus(opts);
  next(locus, opts.initopts);
};

/**
 * Initializes a Locus instance using the browser.
 */
Init.init = function(opts) {
  opts = opts || {};
  opts.initopts = opts.initopts || {};

  opts.initopts.roomKeyVisible = false;
  opts.initopts.roomKeyEnabled = true;
  opts.initopts.initializing = true;
  opts.initopts.log = [{msg: 'initializing...', type: 'info'}];

  var initWindow = new Vue({
    el: '#init-overlay',
    data: {
      opts: opts.initopts
    }
  });

  opts.isHTTPS = location.protocol === 'https:';

  Init.room(opts, function(opts) {
    Init.restore(opts, function(locus, iopts) {
      // restore will instantiate a Locus obj
      Init.webSocket(locus, iopts, function(locus, iopts) {
        Init.location(locus, iopts, function(locus, iopts) {
          opts.initopts.initializing = false;
          locus.initFinish();
        });
      });
    });
  });
};
