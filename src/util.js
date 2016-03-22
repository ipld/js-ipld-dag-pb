'use strict'

var multihashing = require('multihashing')
var isNode = require('detect-node')

exports = module.exports

// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
exports.hash = (data) => multihashing(data, 'sha2-256')
exports.isBrowser = () => !isNode
