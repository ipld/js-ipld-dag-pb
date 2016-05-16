'use strict'

const multihashing = require('multihashing')

exports = module.exports

// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
exports.hash = (data) => multihashing(data, 'sha2-256')
