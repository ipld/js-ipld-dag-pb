'use strict'

const mh = require('multihashes')
const assert = require('assert')

class DAGNode {
  constructor (data, links, serialized, multihash) {
    assert(serialized, 'DAGNode needs its serialized format')
    assert(multihash, 'DAGNode needs its multihash')

    if (typeof multihash === 'string') {
      multihash = mh.fromB58String(multihash)
    }

    this._data = data || new Buffer(0)
    this._links = links || []
    this._serialized = serialized
    this._multihash = multihash

    this._size = this.links.reduce((sum, l) => sum + l.size, this.serialized.length)

    this._json = {
      data: this.data,
      links: this.links.map((l) => l.toJSON()),
      multihash: mh.toB58String(this.multihash),
      size: this.size
    }
  }

  toJSON () {
    return this._json
  }

  toString () {
    const mhStr = mh.toB58String(this.multihash)
    return `DAGNode <${mhStr} - data: "${this.data.toString()}", links: ${this.links.length}, size: ${this.size}>`
  }

  get data () {
    return this._data
  }

  set data (data) {
    throw new Error("Can't set property: 'data' is immutable")
  }

  get links () {
    return this._links
  }

  set links (links) {
    throw new Error("Can't set property: 'links' is immutable")
  }

  get serialized () {
    return this._serialized
  }

  set serialized (serialized) {
    throw new Error("Can't set property: 'serialized' is immutable")
  }

  get size () {
    return this._size
  }

  set size (size) {
    throw new Error("Can't set property: 'size' is immutable")
  }

  get multihash () {
    return this._multihash
  }

  set multihash (multihash) {
    throw new Error("Can't set property: 'multihash' is immutable")
  }
}

exports = module.exports = DAGNode
exports.create = require('./create')
exports.clone = require('./clone')
exports.addLink = require('./addLink')
exports.rmLink = require('./rmLink')
