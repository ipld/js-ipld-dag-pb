var util = require('./util')
if (util.isBrowser()) {
  window.Buffer = require('buffer/').Buffer
}

// Immutable block of data
var Block = function (data) {
  if (!data) { return null }

  var buf = new Buffer(data)
  var multihash = util.hash(buf)

  this.key = function () {
    return multihash
  }

  this.data = function () {
    return buf
  }
  return this
}
module.exports = Block
