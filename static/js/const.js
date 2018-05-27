var DEFAULT_PP = getRandomPP();
var ICON_SIZE = 42; // '0.5em';

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
  USER_DC: 'userdc'    // user disconnected
};
