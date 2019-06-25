'use strict'

const sort = require('stable')
const {
  serialize
} = require('../util')
const dagNodeUtil = require('./util')
const linkSort = dagNodeUtil.linkSort
const DAGNode = require('./dagNode')
const DAGLink = require('../dag-link/dagLink')

const create = (data, links = []) => {
  if (typeof data === 'string') {
    data = Buffer.from(data)
  }

  if (!Buffer.isBuffer(data)) {
    throw new Error('Passed \'data\' is not a buffer or a string!')
  }
  links = links.map((link) => {
    return DAGLink.isDAGLink(link) ? link : DAGLink.util.createDagLinkFromB58EncodedHash(link)
  })
  links = sort(links, linkSort)

  const serialized = serialize({
    Data: data,
    Links: links
  })

  return new DAGNode(data, links, serialized.length)
}

module.exports = create
