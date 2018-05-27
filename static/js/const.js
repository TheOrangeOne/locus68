var DEFAULT_AVATAR = '/static/img/def.png';
var USER_AVATAR = getRandomPP();
var ICON_SIZE = 42; // '0.5em';

// the interval in which to persist to localStorage (milliseconds)
var PERSIST_INTERVAL = 5000;

// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
var WS_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

/* message protocol
 *
 * a message looks like
 * msg = {
 *   user: USER_ID,
 *   type: MSG_TYPE,
 *   data: MSG_DATA,
 * }
 */
var MSG_TYPE = {
  LOCATION_UPDATE: 'locu',    // location update for a user
  USER_DISCONNECT: 'userdc',  // user disconnected
  AVATAR_UPDATE: 'ava'        // avatar update for a user
};
