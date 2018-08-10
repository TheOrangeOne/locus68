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

// polyfill for Object.keys
if (!Object.keys) {
  var hasDontEnumBug = true,
    dontEnums = [
      "toString",
      "toLocaleString",
      "valueOf",
      "hasOwnProperty",
      "isPrototypeOf",
      "propertyIsEnumerable",
      "constructor"
    ],
    dontEnumsLength = dontEnums.length;

  for (var key in {"toString": null}) {
    hasDontEnumBug = false;
  }

  Object.keys = function keys(object) {
    if (
      (typeof object != "object" && typeof object != "function") ||
      object === null
    ) {
      throw new TypeError("Object.keys called on a non-object");
    }

    var keys = [];
    for (var name in object) {
      if (owns(object, name)) {
        keys.push(name);
      }
    }

    if (hasDontEnumBug) {
      for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
        var dontEnum = dontEnums[i];
        if (owns(object, dontEnum)) {
          keys.push(dontEnum);
        }
      }
    }
    return keys;
  };
}


function Lib() {};

// http://stackoverflow.com/a/5092846
Lib.randomColour = function() {
  return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
};

Lib.prettyTime = function(time) {
  if (!time)
    return '?';
  var sec = Math.round(time/1000);
  var min = Math.round(sec/60);
  var hr = Math.round(min/60);
  if (sec < 60) {
    return sec + 's';
  }
  else if (min < 60) {
    return min + 'm';
  }
  else if (hr < 60) {
    return hr + 'h';
  }
  return '∞';
};

if (typeof window === 'undefined') {
  module.exports = Lib;
}
