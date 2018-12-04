'use strict'

const DAGLink = require('./../dag-link')
const { cid, serialize } = require('../ipld-format.js')

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
  const aBuf = Buffer.from(a.name || '')
  const bBuf = Buffer.from(b.name || '')

  return aBuf.compare(bBuf)
}

/*
 * toDAGLink converts a DAGNode to a DAGLink
 */
const toDAGLink = async (node, options = {}) => {
  const serialized = await serialize(node)
  const nodeCid = await cid(serialized)
  return new DAGLink(options.name || '', serialized.length, nodeCid)
}

exports.cloneData = cloneData
exports.cloneLinks = cloneLinks
exports.linkSort = linkSort
exports.toDAGLink = toDAGLink
