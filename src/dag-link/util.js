'use strict'

const DAGLink = require('./dagLink')

function createDagLinkFromB58EncodedHash (link) {
  return new DAGLink(
    link.Hash || link.hash || link.multihash || link.cid,
    link.Name || link.name
  )
}

exports = module.exports
exports.createDagLinkFromB58EncodedHash = createDagLinkFromB58EncodedHash
