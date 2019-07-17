'use strict'

const DAGLink = require('../dag-link/dagLink')
const { serializeDAGNode } = require('../serialize')
const genCid = require('../genCid')

/*
 * toDAGLink converts a DAGNode to a DAGLink
 */
const toDAGLink = async (node, options = {}) => {
  const serialized = serializeDAGNode(node)
  const nodeCid = await genCid.cid(serialized)
  return new DAGLink(options.name || '', serialized.length, nodeCid)
}

module.exports = toDAGLink
