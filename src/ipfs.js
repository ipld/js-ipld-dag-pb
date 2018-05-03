'use strict'

exports.DAGNode = require('./dag-node')
exports.DAGLink = require('./dag-link')

/*
 * Functions to fulfil IPLD Format interface
 * https://github.com/ipld/interface-ipld-format
 */
exports.resolver = Object.assign({}, require('./resolver'), {
  // Resolve like go-ipfs 0.4.14 does
  resolve (binaryBlob, path, callback) {
    exports.util.deserialize(binaryBlob, (err, node) => {
      if (err) {
        return callback(err)
      }

      if (!path) {
        return callback(null, { value: node, remainderPath: '' })
      }

      const split = path.split('/')
      const links = node.links.filter(l => l.name === split[0])

      if (!links.length) {
        return callback(new Error('no link by that name'))
      }

      const value = { '/': links[0].toJSON().multihash }
      const remainderPath = split.slice(1).join('/')

      callback(null, { value: value, remainderPath: remainderPath })
    })
  },

  tree (binaryBlob, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    options = options || {}

    exports.util.deserialize(binaryBlob, (err, node) => {
      if (err) {
        return callback(err)
      }

      const paths = node.links.map(l => l.name).filter(Boolean)
      callback(null, paths)
    })
  }
})

exports.util = require('./util')
