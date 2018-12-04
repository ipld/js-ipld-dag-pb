'use strict'

const CID = require('cids')

// TODO vmx 2018-12-03: Find out why the original code did cloning of the link
// and node. Why isn't the link just added to the existing node
const rmLink = (dagNode, nameOrCid) => {
  if (typeof nameOrCid === 'string') {
    dagNode.links = dagNode.links.filter((link) => link.name !== nameOrCid)
  } else if (Buffer.isBuffer(nameOrCid) || CID.isCID(nameOrCid)) {
    dagNode.links = dagNode.links.filter((link) => !link.cid.equals(nameOrCid))
  } else {
    throw new Error('second arg needs to be a name or CID')
  }
}

module.exports = rmLink
