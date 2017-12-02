'use strict'

const mh = require('multihashes')
const assert = require('assert')

// Link represents an IPFS Merkle DAG Link between Nodes.
class DAGLink {
  constructor (name, size, multihash) {
    assert(multihash, 'A link requires a multihash to point to')
    // assert(size, 'A link requires a size')
    //  note - links should include size, but this assert is disabled
    //  for now to maintain consistency with go-ipfs pinset

    this._name = name
    this._size = size

    if (typeof multihash === 'string') {
      this._multihash = mh.fromB58String(multihash)
    } else if (Buffer.isBuffer(multihash)) {
      this._multihash = multihash
    }
  }

  toString () {
    const mhStr = mh.toB58String(this.multihash)
    return `DAGLink <${mhStr} - name: "${this.name}", size: ${this.size}>`
  }

  toJSON () {
    return {
      name: this.name,
      size: this.size,
      multihash: mh.toB58String(this._multihash)
    }
  }

  get name () {
    return this._name
  }

  set name (name) {
    throw new Error("Can't set property: 'name' is immutable")
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

exports = module.exports = DAGLink
exports.create = require('./create')
exports.util = require('./util')
