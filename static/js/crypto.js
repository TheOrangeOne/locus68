if (typeof window === 'undefined') {
  var forge = require('./forge.min.js');
}

function Crypt(opts) {
  opts = opts || {};
  this.pass = opts.pass || 'todothisshouldberandomandnotthis';

  var self = this;

  this.encrypt = function(data) {
    var cipher = forge.cipher.createCipher('AES-GCM', self.key);
    var iv = forge.random.getBytesSync(16);
    cipher.start({
      iv: iv
    });
    cipher.update(forge.util.createBuffer(data));
    cipher.finish();
    var ct = {
      'iv': iv,
      'ct': cipher.output.bytes(),
      'tag': cipher.mode.tag.bytes()
    };
    return ct;
  };

  this.decrypt = function(edata) {
    var dec = forge.cipher.createDecipher('AES-GCM', self.key);
    dec.start({
      iv: edata.iv,
      tag: forge.util.createBuffer(edata.tag)
    });
    dec.update(forge.util.createBuffer(edata.ct));

    var data;
    if (!dec.finish()) {
      console.error("bad gcm tag! (possible tampering)");
      data = null;
    } else {
      data = dec.output.bytes();
    }
    return data;
  };

  this.init = function() {
    if (self.pass) {
      self.key = forge.pkcs5.pbkdf2(self.pass, 'nacl', 10000, 16);
    }
  };

  this.init();
};

Crypt.hash = function(s) {
  var md = forge.md.sha512.create();
  md.update(s);
  return md.digest();
};

Crypt.toHex = function(data) {
  return forge.util.bytesToHex(data);
};


if (typeof window === 'undefined') {
  module.exports = Crypt;
}
