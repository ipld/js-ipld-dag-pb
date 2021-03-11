'use strict'

const resolver = require('./resolver')
const util = require('./util')
const DAGNode = require('./dag-node/dagNode')
const DAGLink = require('./dag-link/dagLink')

/**
 * @typedef {import('./types').DAGLinkLike} DAGLinkLike
 * @typedef {import('./types').DAGNodeLike} DAGNodeLike
 * @typedef {import('interface-ipld-format').Format<DAGNode>} DAGNodeFormat
 */

/**
 * @type {DAGNodeFormat & { DAGNode: DAGNode, DAGLink: DAGLink }}
 */
module.exports = {
  DAGNode,
  DAGLink,

  /**
   * Functions to fulfil IPLD Format interface
   * https://github.com/ipld/interface-ipld-format
   */
  resolver,
  util,
  codec: util.codec,
  defaultHashAlg: util.defaultHashAlg
}
