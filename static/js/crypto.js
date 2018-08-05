if (typeof window === 'undefined') {
  var forge = require('./forge.min.js');
}

function Crypto(opts) {
  opts = opts || {};
  this.pass = opts.pass || 'todothisshouldberandom';

  var self = this;

  this.encrypt = function(data) {
    var cipher = forge.cipher.createCipher('AES-GCM', self.key);
    var iv = forge.random.getBytesSync(16);
    cipher.start({
      iv: iv
    });
    cipher.update(forge.util.createBuffer(data));
    cipher.finish();
    data = JSON.stringify({
      'iv': iv,
      'ct': cipher.output.bytes(),
      'tag': cipher.mode.tag.bytes()
    });
    return data;
  };

  this.decrypt = function(data) {
    var d = forge.cipher.createDecipher('AES-GCM', self.key);
    d.start({
      iv: data.iv,
      tag: forge.util.createBuffer(data.tag)
    });
    d.update(forge.util.createBuffer(data.ct));

    if (!d.finish()) {
      console.error("bad gcm tag! (possible tampering)");
      data = null;
    } else {
      data = d.output.bytes();
      // console.log("decrypted via key " + forge.util.bytesToHex(self.key) + " and got msg " + JSON.stringify(msg));
    }
    return data;
  };

  this.hash = function(s) {
    var md = forge.md.sha512.create();
    md.update(s);
    return md.digest();
  };

  this.init = function() {
    self.key = forge.pkcs5.pbkdf2(self.pass, 'nacl', 10000, 16);
  };

  this.toHex = function(data) {
    return forge.util.bytesToHex(data);
  };


  this.init();
};


if (typeof window === 'undefined') {
  module.exports = Crypto;
}
