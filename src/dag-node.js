var util = require('./util')
var protobuf = require('protocol-buffers')

var schema = 'message PBLink {optional bytes Hash = 1; optional string Name = 2;optional uint64 Tsize = 3;} message PBNode {repeated PBLink Links = 2; optional bytes Data = 1;}'

var mdagpb = protobuf(schema)

exports = module.exports = {
  DAGLink: DAGLink,
  DAGNode: DAGNode
}

function DAGNode (data, links) {
  var cached
  var encoded

  this.data = data
  this.links = links || []

  function linkSort (a, b) {
    return a.name.localeCompare(b.name)
  }

  // copy - returns a clone of the DAGNode
  this.copy = () => {
    var clone = new DAGNode()
    if (this.data && this.data.length > 0) {
      var buf = new Buffer(this.data.length)
      this.data.copy(buf)
      clone.data = buf
    }

    if (this.links.length > 0) {
      clone.links = links.slice()
    }

    return clone
  }

  // addNodeLink - adds a DAGLink to this node that points to node by a name
  this.addNodeLink = (name, node) => {
    if (typeof name !== 'string') {
      return
    }
    var link = this.makeLink(node)

    link.name = name
    this.addRawLink(link)
  }

  // addRawLink adds a Link to this node from a DAGLink
  this.addRawLink = (link) => {
    encoded = null
    this.links.push(new DAGLink(link.name, link.size, link.hash))
    this.links.sort(linkSort)
  }

  // UpdateNodeLink return a copy of the node with the link name set to point to
  // that. If a link of the same name existed, it is replaced.
  // TODO this would make more sense as an utility
  this.updateNodeLink = (name, node) => {
    var newnode = this.copy()
    newnode.removeNodeLink(name)
    newnode.addNodeLink(name, node)
    return newnode
  }

  // removeNodeLink removes a Link from this node based on name
  this.removeNodeLink = (name) => {
    encoded = null // uncache
    this.links = this.links.filter(link => {
      if (link.name === name) {
        return false
      } else {
        return true
      }
    })
  }

  // makeLink returns a DAGLink node from a DAGNode
  // TODO: this would make more sense as an utility
  this.makeLink = (node) => {
    var size = node.size()
    var mh = node.multihash()
    return new DAGLink(null, size, mh)
  }

  // multihash - returns the multihash value of this DAGNode
  this.multihash = () => {
    this.encoded()
    return cached
  }

  // Size returns the total size of the data addressed by node,
  // including the total sizes of references.
  this.size = () => {
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
  this.encoded = (force) => {
    if (force || !encoded) {
      encoded = this.marshal()

      if (encoded) {
        cached = util.hash(encoded)
      }
    }
    return encoded
  }

  // marshal - encodes the DAGNode into a probuf
  this.marshal = () => {
    var pbn = toProtoBuf(this)
    var data = mdagpb.PBNode.encode(pbn)
    return data
  }

  // unMarshal - decodes a protobuf into a DAGNode
  // TODO: this would make more sense as an utility
  this.unMarshal = (data) => {
    var pbn = mdagpb.PBNode.decode(data)
    this.links = []
    for (var i = 0; i < pbn.Links.length; i++) {
      var link = pbn.Links[i]
      var lnk = new DAGLink(link.Name, link.Tsize, link.Hash)
      this.links.push(lnk)
    }
    this.links.sort(linkSort)
    this.data = pbn.Data || new Buffer(0)
    return this
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
}

// Link represents an IPFS Merkle DAG Link between Nodes.
function DAGLink (name, size, hash) {
  this.name = name
  this.size = size
  this.hash = hash
}
