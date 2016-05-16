'use strict'

const protobuf = require('protocol-buffers')
const stable = require('stable')
const fs = require('fs')
const path = require('path')
const mh = require('multihashes')

const util = require('./util')
const DAGLink = require('./dag-link')

const proto = protobuf(fs.readFileSync(path.join(__dirname, 'merkledag.proto')))

function linkSort (a, b) {
  return (new Buffer(a.name, 'ascii').compare(new Buffer(b.name, 'ascii')))
}

// Helper method to get a protobuf object equivalent
function toProtoBuf (node) {
  const pbn = {}

  if (node.data && node.data.length > 0) {
    pbn.Data = node.data
  } else {
    pbn.Data = null // new Buffer(0)
  }

  if (node.links.length > 0) {
    pbn.Links = node.links.map((link) => {
      return {
        Hash: link.hash,
        Name: link.name,
        Tsize: link.size
      }
    })
  } else {
    pbn.Links = null
  }

  return pbn
}

module.exports = class DAGNode {
  constructor (data, links) {
    this._cached = null
    this._encoded = null

    this.data = data
    this.links = []

    // ensure links are instances of DAGLink
    if (links) {
      links.forEach((l) => {
        if (l.name && typeof l.toJSON === 'function') {
          this.links.push(l)
        } else {
          this.links.push(
            new DAGLink(l.Name, l.Size, l.Hash)
          )
        }
      })

      stable.inplace(this.links, linkSort)
    }
  }

  // copy - returns a clone of the DAGNode
  copy () {
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

  // addNodeLink - adds a DAGLink to this node that points to node by a name
  addNodeLink (name, node) {
    if (typeof name !== 'string') {
      return
    }
    const link = this.makeLink(node)

    link.name = name
    this.addRawLink(link)
  }

  // addRawLink adds a Link to this node from a DAGLink
  addRawLink (link) {
    this._encoded = null
    this.links.push(new DAGLink(link.name, link.size, link.hash))
    stable.inplace(this.links, linkSort)
  }

  // UpdateNodeLink return a copy of the node with the link name set to point to
  // that. If a link of the same name existed, it is replaced.
  // TODO this would make more sense as an utility
  updateNodeLink (name, node) {
    const newnode = this.copy()
    newnode.removeNodeLink(name)
    newnode.addNodeLink(name, node)
    return newnode
  }

  // removeNodeLink removes a Link from this node based on name
  removeNodeLink (name) {
    this._encoded = null // uncache
    this.links = this.links.filter((link) => {
      if (link.name === name) {
        return false
      } else {
        return true
      }
    })
  }

  // removeNodeLink removes a Link from this node based on a multihash
  removeNodeLinkByHash (multihash) {
    this._encoded = null // uncache
    this.links = this.links.filter((link) => {
      if (link.hash.equals(multihash)) {
        return false
      } else {
        return true
      }
    })
  }

  // makeLink returns a DAGLink node from a DAGNode
  // TODO: this would make more sense as an utility
  makeLink (node) {
    return new DAGLink(null, node.size(), node.multihash())
  }

  // multihash - returns the multihash value of this DAGNode
  multihash () {
    this.encoded()
    return this._cached
  }

  // Size returns the total size of the data addressed by node,
  // including the total sizes of references.
  size () {
    const buf = this.encoded()
    if (!buf) {
      return 0
    }

    return this.links.reduce((sum, l) => sum + l.size, buf.length)
  }

  // Encoded returns the encoded raw data version of a Node instance.
  // It may use a cached encoded version, unless the force flag is given.
  encoded (force) {
    if (force || !this._encoded) {
      this._encoded = this.marshal()

      if (this._encoded) {
        this._cached = util.hash(this._encoded)
      }
    }
    return this._encoded
  }

  // marshal - encodes the DAGNode into a probuf
  marshal () {
    return proto.PBNode.encode(toProtoBuf(this))
  }

  // unMarshal - decodes a protobuf into a DAGNode
  // TODO: this would make more sense as an utility
  unMarshal (data) {
    const pbn = proto.PBNode.decode(data)
    this.links = pbn.Links.map((link) => {
      return new DAGLink(link.Name, link.Tsize, link.Hash)
    })

    stable.inplace(this.links, linkSort)
    this.data = pbn.Data || new Buffer(0)
    return this
  }

  toJSON () {
    return {
      Data: this.data,
      Links: this.links.map((l) => l.toJSON()),
      Hash: mh.toB58String(this.multihash()),
      Size: this.size()
    }
  }

  toString () {
    const hash = mh.toB58String(this.multihash())
    return `DAGNode <${hash} - data: "${this.data.toString()}", links: ${this.links.length}, size: ${this.size()}>`
  }
}
