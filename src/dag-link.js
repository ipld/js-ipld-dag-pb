'use strict'

const mh = require('multihashes')

// Link represents an IPFS Merkle DAG Link between Nodes.
class DAGLink {
  constructor (name, size, multihash) {
    this.name = name
    this.size = size

    if (typeof multihash === 'string') {
      this.multihash = mh.fromB58String(multihash)
    } else if (Buffer.isBuffer(multihash)) {
      this.multihash = multihash
    }

    this.json = {
      name: this.name,
      size: this.size,
      hash: this.multihash ? mh.toB58String(this.multihash) : undefined
    }
  }

  toString () {
    const mhStr = mh.toB58String(this.multihash)
    return `DAGLink <${mhStr} - name: "${this.name}", size: ${this.size}>`
  }
}

module.exports = DAGLink
