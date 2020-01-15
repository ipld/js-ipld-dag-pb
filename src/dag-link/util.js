'use strict'

const DAGLink = require('./dagLink')

function createDagLinkFromB58EncodedHash (link) {
  return new DAGLink(
    link.Name || link.name || '',
    link.Hash || link.hash || link.multihash || link.cid
  )
}

exports = module.exports
exports.createDagLinkFromB58EncodedHash = createDagLinkFromB58EncodedHash
