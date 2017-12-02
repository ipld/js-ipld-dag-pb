'use strict'

const DAGLink = require('./index')

function isDagLink (link) {
  return link && link.constructor && link.constructor.name === 'DAGLink'
}

function createDagLinkFromB58EncodedHash (link) {
  return new DAGLink(
    link.name ? link.name : link.Name,
    link.size ? link.size : link.Size,
    link.hash || link.Hash || link.multihash
  )
}

exports = module.exports
exports.isDagLink = isDagLink
exports.createDagLinkFromB58EncodedHash = createDagLinkFromB58EncodedHash
