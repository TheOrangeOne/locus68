var assert = require('assert');
var Config = require('../js/conf.js');
var Locus = require('../js/locus.js');
var User = require('../js/user.js').User;
var { WebSocket, Server } = require('./mock-socket.min.js');


function MockMap(opts) {}

function MockGeolocation(opts) {}
MockGeolocation.watchPosition = (onLoc, onError, opts) => {}

const locusMockOpts = {
  roomName: 'mockRoom',
  user: new User({
    id: 'userid',
  }),
  Map: MockMap,
  host: 'localhost',
  Geolocation: MockGeolocation,
  isHTTPS: true,
  persistEnabled: false,
  tslsEnabled: false,
  uiEnabled: false,
};

const serverURL = 'wss://localhost/ws/mockRoom?id=userid';

describe('Locus', () => {
  describe('Locus()', () => {
    it('should initialize properly', () => {
      var locus = new Locus({
        roomName: 'testroom'
      });
    });
  });

  describe('initialization', () => {
    it('should initialize and send an update message', (done) => {
      // obtain room information successfully
      const locus = new Locus({
        ...locusMockOpts,
      });

      const server = new Server(serverURL);
      server.on('connection', socket => {
        // mock the connection message
        socket.send(JSON.stringify({
          type: 'userco',
          user: 'userid',
          data: {}
        }));
        socket.on('message', data => {
          socket.send(data);
        });
      });

      locus.initWithLocation(37.774929, -122.419416);

      // override the onMsg handler of locus to confirm that
      // the update message is sent and received properly
      let msgCount = 0;
      locus.onMsg = (msg) => {
        msgCount++;
        if (msgCount === 1 && msg.type === 'userco') {
          assert.equal(msg.user, 'userid');
        } else if (msgCount === 2 && msg.type === 'userup') {
          assert.equal(msg.user, 'userid');
          assert.equal(msg.data.lat, 37.774929);
          assert.equal(msg.data.lng, -122.419416);
        } else {
          assert(false);
        }
      };
      locus.initSocket(WebSocket);

      setTimeout(() => {
        assert(locus.isWSReady());
        assert(locus.user.isReady());
        locus.initFinalize()
        server.stop(done);
      }, 15);
    });
  });

  describe('getWSURL', () => {
    it('should return the right url', () => {
      var locus = new Locus({
        user: new User({ id: 'userid' }),
        host: 'localhost',
        roomName: 'room',
        isHTTPS: true
      });
      assert.equal(locus.getWSURL(), 'localhost/ws/room?id=userid')
    });
  });

  describe('behaviour', () => {
    /**
     * Perform a rudimentary setup of a locus instance to use
     * for further testing.
     *
     * Returns a promise containing an initialized locus
     * instance.
     */
    const setupLocus = (expectedOnMsg) => {
      // obtain room information successfully
      const locus = new Locus({
        ...locusMockOpts,
      });
      locus.initWithLocation(37.774929, -122.419416);
      if (expectedOnMsg) {
        locus.onMsg = expectedOnMsg;
      }
      locus.initSocket(WebSocket);
      return new Promise((res, rej) => {
        setTimeout(() => {
          assert(locus.isWSReady());
          locus.initFinalize()
          res(locus);
        }, 15);
      })
    };

    describe('receiving updates', () => {
      /**
       * In this test case there is one user sitting in the
       * room already.
       *
       * The test user connects to the room and is sent an
       * update from the other user.
       */
      it('should successfully handle a different user update', (done) => {
        const server = new Server(serverURL);
        server.on('connection', socket => {
          // send a different user update message
          socket.send(JSON.stringify({
            type: Config.MSG_TYPE.USER_UPDATE,
            user: 'aDifferentUser',
            data: {
              id: 'aDifferentUser',
              lat: 1,
              lng: 2,
              img: '3'
            }
          }));

          // send the connection message for the test user
          socket.send(JSON.stringify({
            type: Config.MSG_TYPE.USER_CONNECT,
            user: 'userid',
            data: {}
          }));
        });

        const locus = setupLocus()
          .then((locus) => {
            setTimeout(() => {
              const users = locus.otherUsers;
              assert.equal(users.numUsers(), 1);
              assert(users.hasUser('aDifferentUser'));
              const user = users.getUser('aDifferentUser');
              assert.equal(user.lat, 1);
              assert.equal(user.lng, 2);
              assert.equal(user.img, '3');
              server.stop(done);
            }, 20);
          });
      });
    });
  });

  describe('serialization', () => {
  });
});
