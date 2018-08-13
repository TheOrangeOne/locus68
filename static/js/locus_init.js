function Init() {};

/**
 * Attempts to initialize a websocket connection with the
 * server.
 *
 * if successful next will be called
 */
Init.webSocket = function(opts, locus, next) {
  var room = locus.roomName;
  opts.addLog({
    type: 'info',
    msg: 'connecting to room ' + Lib.prettyRoomName(room, 13)
  });

  if (!window.WebSocket) {
    opts.addLog({
      type: 'error',
      msg: 'websockets not supported in your browser'
    });
    return;
  }

  locus.initWithWS(window.WebSocket);

  // not sure if this is the best approach
  // we could also have this wait logic implemented on send
  var waitForMsgr = function() {
    setTimeout(function() {
      if (!locus.isWSReady()) {
        opts.addLog({ type: 'info', msg: 'connecting...' });
        waitForMsgr();
      }
      else {
        opts.addLog({ type: 'info', msg: 'connected!' });
        next(opts, locus);
      }
    }, 500);
  };

  waitForMsgr();
};

/**
 * Attempts to get an initial location by querying the
 * geolocation provider.
 *
 * if successfull then adds the location information to opts
 * and calls next
 */
Init.location = function(opts, locus, next) {
  opts.addLog({
    type: 'info',
    msg: 'getting location'
  });

  if (opts.Geolocation) {
    opts.Geolocation.getCurrentPosition(
      function(pos) {
        opts.addLog({
          type: 'info',
          msg: 'got location!'
        });
        var c = pos.coords;
        locus.initWithLocation(c.latitude, c.longitude);
        next(opts, locus);
      },
      function(err) {
        opts.addLog({
          type: 'error',
          msg: 'failed to get location!'
        });
      },
      Config.GEO_CONFIG
    )
  }
  else {
    opts.addLog({
      type: 'error',
      msg: 'failed to get location!'
    });
  }
};

/**
 * Attempts to restore state from localStorage.
 */
Init.restore = function(opts, next) {
  opts.addLog({
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
    opts.addLog({
      type: 'warn',
      msg: 'failed to restore state'
    });
  }

  console.log(opts);
  // create and return a locus instance from the opts
  try {
    var locus = new Locus(opts);
    next(opts, locus);
  }
  catch (e) {
    opts.addLog({
      type: 'error',
      msg: 'could not initialize locus'
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
 *  when the information has been determined, next is called
 */
Init.room = function(opts, next) {
  var path = opts.path;

  opts.addLog({
    type: 'info',
    msg: 'initializing room'
  });

  if (path.substr(0, 3) === '/r/') {
    opts.roomName = path.substr(3, path.length);
    next(opts);
  }
  else if (path === '/x' || path == '/x/') {
    opts.roomKeyEnabled = true;
    opts.roomKeyVisible = true;

    // run on submit of room key
    opts.roomKeySubmit = function(e) {
      var val = e.target.value;
      if (!Config.isInvalidPass(val)) {
        opts.roomKeyEnabled = false;
        opts.roomKeyVisible = false;
        opts.pass = e.target.value;
        opts.roomName = Crypt.hash(opts.pass).toHex();
        next(opts);
      } else {
        opts.addLog({
          type: 'warn',
          msg: 'key ' + Config.isInvalidPass(val)
        });
      }
    };
  } else {
    // backend should prevent us from ever getting here
    opts.addLog({
      type: 'error',
      msg: 'invalid route specified'
    });
  }
};

/**
 * Initializes a Locus instance in the browser.
 *
 * this deals with async stuff like obtaining a web socket
 * connection, location information
 */
Init.init = function(opts) {
  var initopts = {
    roomKeyVisible: false,
    roomKeyEnabled: true,
    initializing: true,
    log: [{
      type: 'info',
      msg: 'initializing...'
    }],
    addLog: function(opts) {
      this.log.push({
        type: opts.type,
        msg: opts.msg
      });
    }
  };

  // merge the options given with the init options we will use
  for (var key in opts) {
    initopts[key] = opts[key];
  }

  var initWindow = new Vue({
    el: '#init-overlay',
    data: {
      opts: initopts
    }
  });

  // invoke the callback chain
  Init.room(initopts, function(opts) {
    Init.restore(opts, function(opts, locus) {
      // restore will instantiate a Locus obj
      Init.location(opts, locus, function(opts, locus) {
        Init.webSocket(opts, locus, function(opts, locus) {
          opts.initializing = false;
          locus.initFinalize();
        });
      });
    });
  });
};
