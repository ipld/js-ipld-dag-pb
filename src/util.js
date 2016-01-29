var multihashing = require('multihashing')

exports = module.exports

// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
exports.hash = (data) => { return multihashing(data, 'sha2-256') }
exports.isBrowser = () => { return !!global.window }
