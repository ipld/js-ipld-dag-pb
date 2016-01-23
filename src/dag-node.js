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

  // UpdateNodeLink return a copy of the node with the link name set to point to
  // that. If a link of the same name existed, it is removed.
  this.updateNodeLink = (name, node) => {
    var newnode = this.copy()
    newnode.removeNodeLink(name)
    newnode.addNodeLink(name, node)
    return newnode
  }

  // Copy returns a copy of the node.
  // NOTE: does not make copies of Node objects in the links.
  this.copy = () => {
    if (this.data && this.data.length > 0) {
      var buf = new Buffer(this.data.length)
      this.data.copy(buf)
      var node = new DAGNode()
      node.data(buf)
      node.links(links.slice())
      return node
    }
    return null
  }
  // Remove a link on this node by the given name
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

  // link to another node
  this.makeLink = (node) => {
    var size = node.size()
    var mh = node.multiHash()
    if (!(size && mh)) {
      return null
    }
    return new DAGLink(null, size, mh)
  }

  // AddNodeLink adds a link to another node.
  this.addNodeLink = (name, node) => {
    if (typeof name !== 'string') {
      return
    }
    var link = this.makeLink(node)

    if (!link) {
      return
    }

    link.name = name
    link.node = node
    this.addRawLink(name, link)
  }

  // AddRawLink adds a copy of a link to this node
  this.addRawLink = (name, link) => {
    if (typeof name !== 'string') {
      return
    }
    encoded = null
    this.links.push(new DAGLink(link.name, link.size, link.hash, link.node))
    this.links.sort(linkSort)
  }

  // AddNodeLinkClean adds a link to another node. without keeping a
  // reference to the child node
  this.addNodeLinkClean = (name, node) => {
    if (typeof name !== 'string') {
      return
    }

    var link = this.makeLink(node)

    if (!link) {
      return
    }

    encoded = null
    link.name = name
    this.addRawLink(name, link)
  }

  this.multiHash = () => {
    this.encoded()
    return cached
  }

  this.key = this.multiHash

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

  // Encode into a Protobuf
  this.marshal = () => {
    var pbn = this.getPBNode()
    var data = mdagpb.PBNode.encode(pbn)
    return data
  }

  // Decode from a Protobuf
  this.unMarshal = (data) => {
    var pbn = mdagpb.PBNode.decode(data)
    this.links = []
    for (var i = 0; i < pbn.Links.length; i++) {
      var link = pbn.Links[i]
      var lnk = new DAGLink(link.Name, link.Tsize, link.Hash)
      this.links.push(lnk)
    }
    this.links.sort(linkSort)
    this.data = pbn.Data
    return this
  }

  // Helper method to get a protobuf object equivalent
  this.getPBNode = () => {
    var pbn = {}

    if (this.data && this.data.length > 0) {
      pbn.Data = this.data
    } else {
      pbn.Data = new Buffer(0)
    }

    pbn.Links = []

    for (var i = 0; i < this.links.length; i++) {
      var link = this.links[i]
      pbn.Links.push({
        Hash: link.hash,
        Name: link.name,
        Tsize: link.size
      })
    }

    return pbn
  }
}

// Link represents an IPFS Merkle DAG Link between Nodes.
function DAGLink (linkName, linkSize, linkHash, linkNode) {
  this.name = linkName
  this.size = linkSize
  this.hash = linkHash
  this.node = linkNode
}
