var DEFAULT_AVATAR = '/static/img/def.png';
var USER_AVATAR = getRandomPP();
var ICON_SIZE = 42; // '0.5em';

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
  LOC_UPDATE: 'locu',  // location update for a user
  USER_DC: 'userdc',   // user disconnected
  AVATAR: 'ava'        // avatar update for a user
};
