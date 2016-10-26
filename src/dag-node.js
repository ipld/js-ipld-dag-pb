'use strict'

const stable = require('stable')
const mh = require('multihashes')
const waterfall = require('async/waterfall')

const DAGLink = require('./dag-link')

class DAGNode {
  constructor (data, links) {
    this._cached = {}
    this._updated = false

    this.data = data
    this.links = []

    // validate links
    if (links) {
      links.forEach((l) => {
        if (l.constructor && l.constructor.name === 'DAGLink') {
          this.links.push(l)
        } else {
          this.links.push(
            new DAGLink(l.Name, l.Size, l.Hash)
          )
        }
      })

      stable.inplace(this.links, util.linkSort)
    }
  }

  /*
   * addNodeLink - adds a DAGLink to this node that points
   * to node by a name
   */
  addNodeLink (name, node, callback) {
    if (typeof name !== 'string') {
      throw new Error('first argument must be link name')
    }
    this.makeLink(node, (err, link) => {
      if (err) {
        return callback(err)
      }
      link.name = name
      this.addRawLink(link)
      callback()
    })
  }

  /*
   * addRawLink adds a Link to this node from a DAGLink
   */
  addRawLink (link) {
    this._updated = true
    this.links.push(new DAGLink(link.name, link.size, link.hash))
    stable.inplace(this.links, util.linkSort)
  }

  /*
   * UpdateNodeLink return a copy of the node with the link name
   * set to point to that. If a link of the same name existed,
   * it is replaced.
   */
  // TODO ?? this would make more sense as an utility
  updateNodeLink (name, node) {
    const newnode = this.copy()
    newnode.removeNodeLink(name)
    newnode.addNodeLink(name, node)
    return newnode
  }

  /*
   * removeNodeLink removes a Link from this node based on name
   */
  removeNodeLink (name) {
    this._updated = true

    this.links = this.links.filter((link) => {
      if (link.name === name) {
        return false
      } else {
        return true
      }
    })
  }

  /*
   * removeNodeLink removes a Link from this node based on a multihash
   */
  removeNodeLinkByHash (multihash) {
    this._updated = true

    this.links = this.links.filter((link) => {
      if (link.hash.equals(multihash)) {
        return false
      } else {
        return true
      }
    })
  }

  /*
   * makeLink returns a DAGLink node from a DAGNode
   */
  // TODO: this would make more sense as an utility
  makeLink (node, callback) {
    node.multihash((err, multihash) => {
      if (err) {
        return callback(err)
      }
      node.size((err, size) => {
        if (err) {
          return callback(err)
        }
        callback(null, new DAGLink(null, size, multihash))
      })
    })
  }

  /*
   * clone - returns a clone of the DAGNode
   */
  clone () {
    const clone = new DAGNode()
    if (this.data && this.data.length > 0) {
      const buf = new Buffer(this.data.length)
      this.data.copy(buf)
      clone.data = buf
    }

    if (this.links.length > 0) {
      clone.links = this.links.slice()
    }

    return clone
  }

  /*
   * multihash - returns the multihash value of this DAGNode
   */
  multihash (type, callback) {
    if (typeof type === 'function') {
      callback = type
      type = 'sha2-256'
    }
    if (!this._cached[type] || this._updated) {
      waterfall([
        (cb) => util.serialize(this, cb),
        (serialized, cb) => util.hash(type, serialized, cb)
      ], (err, digest) => {
        if (err) {
          return callback(err)
        }

        this._cached[type] = digest
        this._updated = false
        callback(null, this._cached[type])
      })
    } else {
      callback(null, this._cached[type])
    }
  }

  /*
   * size - returns the total size of the data addressed by node,
   * including the total sizes of references.
   */
  size (callback) {
    util.serialize(this, (err, serialized) => {
      if (err) {
        return callback(err)
      }

      if (!serialized) {
        return callback(null, 0)
      }

      const size = this.links.reduce((sum, l) => {
        return sum + l.size
      }, serialized.length)

      callback(null, size)
    })
  }

  toJSON (callback) {
    this.multihash((err, multihash) => {
      if (err) {
        return callback(err)
      }
      this.size((err, size) => {
        if (err) {
          return callback(err)
        }

        const obj = {
          Data: this.data,
          Links: this.links.map((l) => l.toJSON()),
          Hash: mh.toB58String(multihash),
          Size: size
        }

        callback(null, obj)
      })
    })
  }

  toString (callback) {
    this.multihash((err, multihash) => {
      if (err) {
        return callback(err)
      }
      const multihashStr = mh.toB58String(multihash)
      this.size((err, size) => {
        if (err) {
          return callback(err)
        }

        const str = `DAGNode <${multihashStr} - data: "${this.data.toString()}", links: ${this.links.length}, size: ${size}>`
        callback(null, str)
      })
    })
  }
}

module.exports = DAGNode
const util = require('./util')
