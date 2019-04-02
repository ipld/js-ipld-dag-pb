'use strict'

const CID = require('cids')

const util = require('./util')

exports = module.exports

/*
 * resolve: receives a path and a binary blob and returns the value on path,
 * throw if not possible. `binaryBlob` is the ProtocolBuffer encoded data.
 */
exports.resolve = async (binaryBlob, path) => {
  let node = await util.deserialize(binaryBlob)

  const parts = path.split('/').filter((x) => x)
  while (parts.length) {
    const key = parts.shift()
    if (node[key] === undefined) {
      throw new Error(`Object has no property '${key}'`)
    }

    node = node[key]
    if (CID.isCID(node)) {
      return {
        value: node,
        remainderPath: parts.join('/')
      }
    }
  }

  return {
    value: node,
    remainderPath: ''
  }
}

const traverse = function * (node, path) {
  // Traverse only objects and arrays
  if (Buffer.isBuffer(node) || CID.isCID(node) || typeof node === 'string') {
    return
  }
  for (const item of Object.keys(node)) {
    const nextpath = path === undefined ? item : path + '/' + item
    yield nextpath
    yield * traverse(node[item], nextpath)
  }
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * is an object that can carry several options (i.e. nestness)
 */
exports.tree = async function * (binaryBlob) {
  const node = await util.deserialize(binaryBlob)

  yield * traverse(node)
}
