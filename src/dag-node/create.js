'use strict'

const sort = require('stable')
const {
  serialize
} = require('../util.js')
const dagNodeUtil = require('./util.js')
const linkSort = dagNodeUtil.linkSort
const DAGNode = require('./index.js')
const DAGLink = require('../dag-link')

function create (data, links, callback) {
  if (typeof data === 'function') {
    callback = data
    data = undefined
  } else if (typeof data === 'string') {
    data = Buffer.from(data)
  }
  if (typeof links === 'function') {
    callback = links
    links = []
  }

  if (!Buffer.isBuffer(data)) {
    return callback(new Error('Passed \'data\' is not a buffer or a string!'))
  }

  links = links.map((link) => {
    return DAGLink.isDAGLink(link) ? link : DAGLink.util.createDagLinkFromB58EncodedHash(link)
  })
  links = sort(links, linkSort)

  serialize({
    data, links
  }, (err, buffer) => {
    if (err) {
      return callback(err)
    }

    callback(null, new DAGNode(data, links, buffer.length))
  })
}

module.exports = create
