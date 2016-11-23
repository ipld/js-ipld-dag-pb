'use strict'

const util = require('./util')
const bs58 = require('bs58')

exports = module.exports

exports.multicodec = 'dag-pb'

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data+key)
 */
exports.resolve = (block, path, callback) => {
  util.deserialize(block.data, gotNode)

  function gotNode (err, node) {
    if (err) {
      return callback(err)
    }

    const split = path.split('/')

    if (split[0] === 'links') {
      let remainderPath = ''

      // all links
      if (!split[1]) {
        return callback(null, {
          value: node.links.map((l) => {
            return l.toJSON()
          }),
          remainderPath: ''
        })
      }

      // select one link

      const values = {}

      // populate both index number and name to enable both cases
      // for the resolver
      node.links.forEach((l, i) => {
        const link = l.toJSON()
        values[i] = link.multihash
        values[link.name] = link.multihash
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

      callback(null, { value: value, remainderPath: remainderPath })
    } else if (split[0] === 'data') {
      callback(null, { value: node.data, remainderPath: '' })
    } else {
      callback(new Error('path not available'))
    }
  }
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * is an object that can carry several options (i.e. nestness)
 */
exports.tree = (block, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!options) {
    options = {}
  }

  util.deserialize(block.data, (err, node) => {
    if (err) {
      return callback(err)
    }
    const paths = []
    node.links.forEach((link) => {
      paths.push({
        path: link.name || '',
        value: bs58.encode(link.multihash).toString()
      })
    })

    if (node.data && node.data.length > 0) {
      paths.push({ path: 'data', value: node.data })
    }

    callback(null, paths)
  })
}
