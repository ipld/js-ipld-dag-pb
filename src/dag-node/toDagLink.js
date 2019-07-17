'use strict'

const DAGLink = require('./../dag-link/dagLink')
const { cid, serialize } = require('../util')

/*
 * toDAGLink converts a DAGNode to a DAGLink
 */
const toDAGLink = async (node, options = {}) => {
  const serialized = serialize(node)
  const nodeCid = await cid(serialized)
  return new DAGLink(options.name || '', serialized.length, nodeCid)
}

module.exports = toDAGLink
