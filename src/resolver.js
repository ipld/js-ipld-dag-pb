'use strict'

const DAGNode = require('./index').DAGNode
const bs58 = require('bs58')

exports = module.exports

exports.multicodec = 'dag-pb'

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data+key)
 */
exports.resolve = (block, path) => {
  const node = new DAGNode()
  node.deserialize(block.data)

  const split = path.split('/')

  if (split[0] === 'links') {
    let value = node.links.map((l) => {
      return l.toJSON()
    })

    if (split[1]) {
      value = value[Number(split[1])]
    }

    return value
  } else if (split[0] === 'data') {
    return node.data
  } else {
    throw new Error('path not available')
  }
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * are option (i.e. nestness)
 */
exports.tree = (block, options) => {
  if (!options) {
    options = {}
  }
  const node = new DAGNode()
  node.deserialize(block.data)
  const paths = []
  node.links.forEach((link) => {
    paths.push({
      path: link.name,
      value: bs58.encode(link.hash).toString()
    })
  })

  if (node.data && node.data.length > 0) {
    paths.push({ path: 'data', value: node.data })
  }
  return paths
}

// TODO recheck this API
/*
 * patch: modifies or adds value on path, yields a new block with that change
 */
exports.patch = (block, path, value) => {}
