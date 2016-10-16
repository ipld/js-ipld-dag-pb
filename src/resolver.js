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
    let remainderPath = ''

    // all links
    if (!split[1]) {
      return {
        value: node.links.map((l) => {
          return l.toJSON()
        }),
        remainderPath: ''
      }
    }

    // select one link

    const values = {}

    // populate both index number and name to enable both cases
    // for the resolver
    node.links.forEach((l, i) => {
      const link = l.toJSON()
      values[i] = link.Hash
      values[link.Name] = link.Hash
    })

    let value = values[split[1]]

    // if remainderPath exists, value needs to be CID
    if (split[2]) {
      split.shift()
      split.shift()
      remainderPath = split.join('/')

      value = {
        '/': value
      }
    }

    return { value: value, remainderPath: remainderPath }
  } else if (split[0] === 'data') {
    return { value: node.data, remainderPath: '' }
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
