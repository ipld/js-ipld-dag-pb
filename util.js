var multihashing = require('multihashing')

var util = {}

// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
util.hash = function (data) {
  return multihashing(data, 'sha2-256')
}

util.isBrowser = function () { return !!global.window }

module.exports = util
