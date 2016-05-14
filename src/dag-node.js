'use strict'

const util = require('./util')
const protobuf = require('protocol-buffers')
const stable = require('stable')
const bs58 = require('bs58')

var schema = 'message PBLink {optional bytes Hash = 1; optional string Name = 2;optional uint64 Tsize = 3;} message PBNode {repeated PBLink Links = 2; optional bytes Data = 1;}'

var mdagpb = protobuf(schema)

function linkSort (a, b) {
  return (new Buffer(a.name, 'ascii').compare(new Buffer(b.name, 'ascii')))
}

// Helper method to get a protobuf object equivalent
function toProtoBuf (node) {
  var pbn = {}

  if (node.data && node.data.length > 0) {
    pbn.Data = node.data
  } else {
    pbn.Data = null // new Buffer(0)
  }

  if (node.links.length > 0) {
    pbn.Links = []

    for (var i = 0; i < node.links.length; i++) {
      var link = node.links[i]
      pbn.Links.push({
        Hash: link.hash,
        Name: link.name,
        Tsize: link.size
      })
    }
  } else {
    pbn.Links = null
  }

  return pbn
}

class DAGNode {
  constructor (data, links) {
    this._cached = null
    this._encoded = null

    this.data = data
    this.links = []

    // ensure links are instances of DAGLink
    if (links) {
      links.map((l) => {
        return {
          size: l.size || l.Size,
          name: l.name || l.Name,
          hash: l.hash || l.Hash
        }
      }).forEach((l) => {
        this.addRawLink(l)
      })
    }
  }

  // copy - returns a clone of the DAGNode
  copy () {
    var clone = new DAGNode()
    if (this.data && this.data.length > 0) {
      var buf = new Buffer(this.data.length)
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
    var link = this.makeLink(node)

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
    var newnode = this.copy()
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
    var size = node.size()
    var mh = node.multihash()
    return new DAGLink(null, size, mh)
  }

  // multihash - returns the multihash value of this DAGNode
  multihash () {
    this.encoded()
    return this._cached
  }

  // Size returns the total size of the data addressed by node,
  // including the total sizes of references.
  size () {
    var buf = this.encoded()
    if (!buf) {
      return 0
    }
    var size = buf.length
    for (var i = 0; i < this.links.length; i++) {
      size += this.links[i].size
    }
    return size
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
    var pbn = toProtoBuf(this)
    var data = mdagpb.PBNode.encode(pbn)
    return data
  }

  // unMarshal - decodes a protobuf into a DAGNode
  // TODO: this would make more sense as an utility
  unMarshal (data) {
    var pbn = mdagpb.PBNode.decode(data)
    this.links = []
    for (var i = 0; i < pbn.Links.length; i++) {
      var link = pbn.Links[i]
      var lnk = new DAGLink(link.Name, link.Tsize, link.Hash)
      this.links.push(lnk)
    }
    stable.inplace(this.links, linkSort)
    this.data = pbn.Data || new Buffer(0)
    return this
  }

  toJSON () {
    return {
      Data: this.data,
      Links: this.links.map((l) => { return l.toJSON() }),
      Hash: bs58.encode(this.multihash()).toString(),
      Size: this.size()
    }
  }
}

// Link represents an IPFS Merkle DAG Link between Nodes.
function DAGLink (name, size, hash) {
  if (typeof hash === 'string') {
    this.hash = new Buffer(bs58.decode(hash))
  } else {
    this.hash = hash
  }

  this.name = name
  this.size = size

  this.toJSON = () => {
    return {
      Name: this.name,
      Size: this.size,
      Hash: bs58.encode(this.hash).toString()
    }
  }
}

exports = module.exports = {
  DAGLink: DAGLink,
  DAGNode: DAGNode
}
