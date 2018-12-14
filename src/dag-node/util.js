'use strict'

const DAGLink = require('./../dag-link')
const {
  cid
} = require('../util')

exports = module.exports

function cloneData (dagNode) {
  let data

  if (dagNode.data && dagNode.data.length > 0) {
    data = Buffer.alloc(dagNode.data.length)
    dagNode.data.copy(data)
  } else {
    data = Buffer.alloc(0)
  }

  return data
}

function cloneLinks (dagNode) {
  return dagNode.links.slice()
}

function linkSort (a, b) {
  return Buffer.compare(a.nameAsBuffer, b.nameAsBuffer)
}

/*
 * toDAGLink converts a DAGNode to a DAGLink
 */
function toDAGLink (node, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  cid(node, options, (error, cid) => {
    if (error) {
      return callback(error)
    }

    callback(null, new DAGLink(options.name || '', node.size, cid))
  })
}

exports.cloneData = cloneData
exports.cloneLinks = cloneLinks
exports.linkSort = linkSort
exports.toDAGLink = toDAGLink
