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

// http://stackoverflow.com/a/5092846
function randomColour() {
  return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
}

function getRandomPP() {
  return '/static/img/rand/'+Math.floor((Math.random()*24)+1)+'.png';
}

function makeMapIcon(size, img) {
  return L.icon({
    iconUrl: img,
    iconSize: [size,size],
    iconAnchor: [25,50],
    popupAnchor: [0,-54],
    className: 'img-circle'
  });
};

function cryptoHash(s) {
  var md = forge.md.sha512.create();
  md.update(s);
  return md.digest();
};

