var DS = require('datastore.abstract')

module.exports = MemDS

function MemDS() {
  if (!(this instanceof MemDS))
    return new MemDS
  DS.call(this)
  this.values = {}
}

DS.inherits(MemDS)

MemDS.prototype._get = function(key, cb) {
  var val = this.values[key.toString()]
  if (val !== undefined) cb(null, val, key)
  else cb(MemDS.errors.NotFound, null, key)
}

MemDS.prototype._put = function(key, val, cb) {
  this.values[key.toString()] = val
  cb(null, val, key)
}

MemDS.prototype._delete = function(key, cb) {
  delete this.values[key.toString()]
  cb(null, key)
}

MemDS.prototype._has = function(key, cb) {
  var has = (this.values[key.toString()] !== undefined)
  cb(null, has, key)
}
