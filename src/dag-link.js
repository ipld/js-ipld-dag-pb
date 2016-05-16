'use strict'

const mh = require('multihashes')

// Link represents an IPFS Merkle DAG Link between Nodes.
module.exports = class DAGLink {
  constructor (name, size, hash) {
    this.name = name
    this.size = size

    if (typeof hash === 'string') {
      this.hash = mh.fromB58String(hash)
    } else if (Buffer.isBuffer(hash)) {
      this.hash = hash
    }
  }

  toJSON () {
    return {
      Name: this.name,
      Size: this.size,
      Hash: mh.toB58String(this.hash)
    }
  }

  toString () {
    const hash = mh.toB58String(this.hash)
    return `DAGLink <${hash} - name: "${this.name}", size: ${this.size}>`
  }
}
