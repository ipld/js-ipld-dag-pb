'use strict'

exports.DAGNode = require('./dag-node')
exports.DAGLink = require('./dag-link')

/*
 * Functions to fulfil IPLD Format interface
 * https://github.com/ipld/interface-ipld-format
 */
exports.resolver = require('./resolver')
exports.util = require('./util')

const {
  cid,
  defaultHashAlg,
  deserialize,
  format,
  serialize
} = require('./ipld-format')

exports.cid = cid
exports.defaultHashAlg = defaultHashAlg
exports.deserialize = deserialize
exports.format = format
exports.serialize = serialize
