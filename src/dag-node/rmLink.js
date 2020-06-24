'use strict'

const CID = require('cids')
const { Buffer } = require('buffer')

const rmLink = (dagNode, nameOrCid) => {
  let predicate = null

  // It's a name
  if (typeof nameOrCid === 'string') {
    predicate = (link) => link.Name === nameOrCid
  } else if (Buffer.isBuffer(nameOrCid) || CID.isCID(nameOrCid)) {
    predicate = (link) => link.Hash.equals(nameOrCid)
  }

  if (predicate) {
    const links = dagNode.Links
    let index = 0
    while (index < links.length) {
      const link = links[index]
      if (predicate(link)) {
        links.splice(index, 1)
      } else {
        index++
      }
    }
  } else {
    throw new Error('second arg needs to be a name or CID')
  }
}

module.exports = rmLink
