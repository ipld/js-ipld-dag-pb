'use strict'

const CID = require('cids')

// TODO vmx 2018-12-03: Find out why the original code did cloning of the link
// and node. Why isn't the link just added to the existing node
const rmLink = (dagNode, nameOrCid) => {
  if (typeof nameOrCid === 'string') {
    dagNode._links = dagNode._links.filter((link) => link.name !== nameOrCid)
    delete dagNode[nameOrCid]
  } else if (Buffer.isBuffer(nameOrCid) || CID.isCID(nameOrCid)) {
    const position = dagNode._links.findIndex(
      (link) => link.cid.equals(nameOrCid))
    if (position !== -1) {
      const removedLink = dagNode._links.splice(position)[0]
      delete dagNode[removedLink.name]
    }
  } else {
    throw new Error('second arg needs to be a name or CID')
  }
}

module.exports = rmLink
