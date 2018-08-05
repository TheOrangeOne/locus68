/*
 * library or utility functions providing use
*/

// OP hash function
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


function Library() {
  var self = this;

  // http://stackoverflow.com/a/5092846
  this.randomColour = function() {
    return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  }
};


var Lib = Library();

if (typeof window === 'undefined') {
  module.exports = Lib;
}
