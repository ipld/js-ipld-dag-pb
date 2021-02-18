'use strict'

const resolver = require('./resolver')
const util = require('./util')
const DAGNode = require('./dag-node/dagNode')
const DAGLink = require('./dag-link/dagLink')

/**
 * @typedef {import('./types').DAGLinkLike} DAGLinkLike
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
