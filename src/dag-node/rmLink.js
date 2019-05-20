'use strict'

const CID = require('cids')

const rmLink = (dagNode, nameOrCid) => {
  // It's a name
  if (typeof nameOrCid === 'string') {
    dagNode._links = dagNode._links.filter((link) => {
      if (link.Name !== nameOrCid) {
        return true
      } else {
        // We add named links as property to the object, remove that property
        delete dagNode[link.Name]
        return false
      }
    })
  } else if (Buffer.isBuffer(nameOrCid) || CID.isCID(nameOrCid)) {
    dagNode._links = dagNode._links.filter((link) => {
      if (link.Hash.equals(nameOrCid)) {
        // We add named links as property to the object, remove that property
        if (link.Name && link.Name in dagNode) {
          delete dagNode[link.Name]
        }
        return false
      } else {
        return true
      }
    })
  } else {
    throw new Error('second arg needs to be a name or CID')
  }
}

module.exports = rmLink
