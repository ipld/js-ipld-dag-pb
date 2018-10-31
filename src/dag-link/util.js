'use strict'

const DAGLink = require('./index')

function createDagLinkFromB58EncodedHash (link) {
  return new DAGLink(
    link.name ? link.name : link.Name,
    link.size ? link.size : link.Size,
    link.hash || link.Hash || link.multihash || link.cid
  )
}

exports = module.exports
exports.createDagLinkFromB58EncodedHash = createDagLinkFromB58EncodedHash
