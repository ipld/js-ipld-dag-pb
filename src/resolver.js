'use strict'

const waterfall = require('async/waterfall')
const CID = require('cids')

const util = require('./util')

exports = module.exports
exports.multicodec = 'dag-pb'

/*
 * resolve: receives a path and a binary blob and returns the value on path,
 * throw if not possible. `binaryBlob` is the ProtocolBuffer encoded data.
 */
exports.resolve = (binaryBlob, path, callback) => {
  waterfall([
    (cb) => util.deserialize(binaryBlob, cb),
    (node, cb) => {
      // Return the deserialized block if no path is given
      if (!path) {
        return callback(null, {
          value: node,
          remainderPath: ''
        })
      }

      const split = path.split('/')

      if (split[0] === 'Links') {
        let remainderPath = ''

        // all links
        if (!split[1]) {
          return cb(null, {
            value: node.links.map((l) => l.toJSON()),
            remainderPath: ''
          })
        }

        // select one link

        const values = {}

        // populate both index number and name to enable both cases
        // for the resolver
        node.links.forEach((l, i) => {
          const link = l.toJSON()
          values[i] = {
            hash: link.multihash,
            name: link.name,
            size: link.size
          }
          // TODO by enabling something to resolve through link name, we are
          // applying a transformation (a view) to the data, confirm if this
          // is exactly what we want
          values[link.name] = link.multihash
        })

        let value = values[split[1]]

        // if remainderPath exists, value needs to be CID
        if (split[2] === 'Hash') {
          value = { '/': value.hash }
        } else if (split[2] === 'Tsize') {
          value = { '/': value.size }
        } else if (split[2] === 'Name') {
          value = { '/': value.name }
        }

        remainderPath = split.slice(3).join('/')

        cb(null, { value: value, remainderPath: remainderPath })
      } else if (split[0] === 'Data') {
        cb(null, { value: node.data, remainderPath: '' })
      } else {
        cb(new Error('path not available'))
      }
    }
  ], callback)
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * is an object that can carry several options (i.e. nestness)
 */
exports.tree = (binaryBlob, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  options = options || {}

  util.deserialize(binaryBlob, (err, node) => {
    if (err) {
      return callback(err)
    }

    const paths = []

    paths.push('Links')

    node.links.forEach((link, i) => {
      paths.push(`Links/${i}/Name`)
      paths.push(`Links/${i}/Tsize`)
      paths.push(`Links/${i}/Hash`)
    })

    paths.push('Data')

    callback(null, paths)
  })
}

/*
 * isLink: returns the Link if a given path in a binary blob is a Link,
 * false otherwise
 */
exports.isLink = (binaryBlob, path, callback) => {
  exports.resolve(binaryBlob, path, (err, result) => {
    if (err) {
      return callback(err)
    }

    if (result.remainderPath.length > 0) {
      return callback(new Error('path out of scope'))
    }

    if (typeof result.value === 'object' && result.value['/']) {
      let valid
      try {
        valid = CID.isCID(new CID(result.value['/']))
      } catch (err) {
        valid = false
      }
      if (valid) {
        return callback(null, result.value)
      }
    }

    callback(null, false)
  })
}
