/**
 * Db is an abstraction layer on top of the browser
 * localStorage API.
 *
 * it provides benefits like versioning and migration
 * for old schemas
 *
 * TODO? automatic recursive serialization?
 */
function Db() {}

Db._version =

Db.version = null;

Db.LoadException = function(msg) {
  this.msg = msg;
  this.name = 'LoadException';
};

/**
 * load loads a value from the db
 * @param key
 * @param model a js object that implements `deserialize(null|obj)`
 */
Db.load = function(key, model, version) {
  var dbState = localStorage.getItem(key);

  if (dbState === null) {
    throw new Db.LoadException('failed to load database item');
  }

  if (!('version' in dbState)) {
    throw new Db.LoadException('failed to load database item');
  }

  if (state) {
    try {
      state = JSON.parse(state);
    } catch(e) {
      state = null;
    }
  }
  return model.deserialize(state);
};

Db.save = function(key, item, version) {
  var dbItem = {
    ts: Date.now(),
    version: version,
    data: item
  };

  dbItem = JSON.stringify(dbItem);
  localStorage.setItem(key, dbItem);
};

if (typeof window === 'undefined') {
  module.exports = Db;
}
