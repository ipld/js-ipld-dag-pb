'use strict'

const dagNodeUtil = require('./util')
const cloneLinks = dagNodeUtil.cloneLinks
const cloneData = dagNodeUtil.cloneData
const create = require('./create')
const CID = require('cids')

function rmLink (dagNode, nameOrCid, callback) {
  const data = cloneData(dagNode)
  let links = cloneLinks(dagNode)

  if (typeof nameOrCid === 'string') {
    links = links.filter((link) => link.name !== nameOrCid)
  } else if (Buffer.isBuffer(nameOrCid) || CID.isCID(nameOrCid)) {
    links = links.filter((link) => !link.cid.equals(nameOrCid))
  } else {
    return callback(new Error('second arg needs to be a name or CID'), null)
  }

  create(data, links, callback)
}

module.exports = rmLink
