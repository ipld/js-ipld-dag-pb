'use strict'

const DAGLink = require('./../dag-link')
const {
  cid,
  serialize
} = require('../util')

exports = module.exports

function linkSort (a, b) {
  return Buffer.compare(a.nameAsBuffer, b.nameAsBuffer)
}

/*
 * toDAGLink converts a DAGNode to a DAGLink
 */
const toDAGLink = async (node, options = {}) => {
  const serialized = serialize(node)
  const nodeCid = await cid(serialized)
  return new DAGLink(options.name || '', serialized.length, nodeCid)
}

exports.linkSort = linkSort
exports.toDAGLink = toDAGLink
