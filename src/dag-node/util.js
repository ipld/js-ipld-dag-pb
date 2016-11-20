'use strict'

const DAGLink = require('./../dag-link')

exports = module.exports

function cloneData (dagNode) {
  let data = new Buffer(0)

  if (dagNode.data && dagNode.data.length > 0) {
    data = new Buffer(dagNode.data.length)
    dagNode.data.copy(data)
  }

  return data
}

function cloneLinks (dagNode) {
  return dagNode.links.length > 0 ? dagNode.links.slice() : []
}

function linkSort (a, b) {
  return (new Buffer(a.name || '', 'ascii').compare(new Buffer(b.name || '', 'ascii')))
}

/*
 * toDAGLink converts a DAGNode to a DAGLink
 */
function toDAGLink (node) {
  return new DAGLink('', node.size, node.multihash)
}

exports.cloneData = cloneData
exports.cloneLinks = cloneLinks
exports.linkSort = linkSort
exports.toDAGLink = toDAGLink
