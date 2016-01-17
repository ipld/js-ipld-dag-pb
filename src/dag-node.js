/*
 This is an attempt at an ipfs style merkle dag node
*/

var util = require('./util')
var protobuf = require('protocol-buffers')
var merkledagproto = 'message PBLink {optional bytes Hash = 1; optional string Name = 2;optional uint64 Tsize = 3;} message PBNode {repeated PBLink Links = 2; optional bytes Data = 1;}'
var merklepb = protobuf(merkledagproto)

if (util.isBrowser()) {
  window.Buffer = require('buffer/').Buffer
}

var Node = function () {
  var links = []
  var data
  var cached
  var encoded
  // sort links by their name field
  var linkSort = function (a, b) { return a.name().localeCompare(b.name()) }

  // Getter/Setter chain for Data
  this.data = function () {
    if (arguments.length === 0) {
      return data
    } else {
      if (arguments[0] instanceof Buffer) {
        data = arguments[0]
      }
      return this
    }
  }

  // Getter/Setter chain for Links
  this.links = function () {
    if (arguments.length === 0) {
      return links
    } else {
      if (Array.isArray(arguments[0])) {
        for (var i; i < arguments[0].length; i++) {
          if (!(arguments[0][i] instanceof Link)) {
            return this
          }
        }
        links = arguments[0]
      }

      return this
    }
  }
  // UpdateNodeLink return a copy of the node with the link name set to point to
  // that. If a link of the same name existed, it is removed.
  this.UpdateNodeLink = function (name, node) {
    var newnode = this.copy()
    newnode.removeNodeLink(name)
    newnode.addNodeLink(name, node)
    return newnode
  }

  // Copy returns a copy of the node.
  // NOTE: does not make copies of Node objects in the links.
  this.copy = function () {
    if (data && data.length > 0) {
      var buf = new Buffer(data.length)
      data.copy(buf)
      var node = new Node()
      node.data(buf)
      node.links(links.slice())
      return node
    }
    return null
  }
  // Remove a link on this node by the given name
  this.removeNodeLink = function (name) {
    encoded = null
    var good = []
    // var found
    for (var i = 0; i < links.length; i++) {
      var link = links[i]
      if (!link.name() === name) {
        good.push(link)
      } else {
        // found = true
      }
    }
    links = good
  }

  // link to another node
  var makeLink = function (node) {
    var size = node.size()
    var mh = node.multiHash()
    if (!(size && mh)) {
      return null
    }
    return new Link(null, size, mh)
  }

  // AddNodeLink adds a link to another node.
  this.addNodeLink = function (name, node) {
    if (typeof name !== 'string' || !(node instanceof Node)) {
      return
    }
    var link = makeLink(node)
    if (!link) {
      return
    }
    link.name(name)
    link.node(node)
    this.addRawLink(name, link)
  }

  // AddRawLink adds a copy of a link to this node
  this.addRawLink = function (name, link) {
    if (typeof name !== 'string' || !(link instanceof Link)) {
      return
    }
    encoded = null
    links.push(new Link(link.name(), link.size(), link.hash(), link.node()))
  }

  // AddNodeLinkClean adds a link to another node. without keeping a reference to
  // the child node
  this.addNodeLinkClean = function (name, node) {
    if (typeof name !== 'string' || !(link instanceof Link)) {
      return
    }
    var link = makeLink(node)
    if (!link) {
      return
    }

    encoded = null
    link.name(name)
    this.addRawLink(name, link)
  }

  this.multiHash = function () {
    this.encoded()
    return cached
  }

  this.key = this.multiHash

  // Size returns the total size of the data addressed by node,
  // including the total sizes of references.
  this.size = function () {
    var buf = this.encoded()
    if (!buf) {
      return 0
    }
    var size = buf.length
    for (var i = 0; i < links.length; i++) {
      size += links[i].size()
    }
    return size
  }

  // Encoded returns the encoded raw data version of a Node instance.
  // It may use a cached encoded version, unless the force flag is given.
  this.encoded = function (force) {
    if (force || !encoded) {
      encoded = this.marshal()

      if (encoded) {
        cached = util.hash(encoded)
      }
    }
    return encoded
  }

  // Encode into a Protobuf
  this.marshal = function () {
    var pbn = getPBNode()
    var data = merklepb.PBNode.encode(pbn)
    return data
  }

  // Decode from a Protobuf
  this.unMarshal = function (data) {
    var pbn = merklepb.PBNode.decode(data)
    for (var link in pbn.Links) {
      var lnk = new Link(link.Name, link.Tsize, link.Hash)
      links.push(lnk)
    }
    links.sort(linkSort)
    data = pbn.Data
    return this
  }

  // Helper method to get a protobuf object equivalent
  var getPBNode = function () {
    var pbn = {}
    pbn.Links = []

    for (var i = 0; i < links.length; i++) {
      var link = links[i]
      pbn.Links.push({
        Hash: link.hash(),
        Name: link.name(),
        Tsize: link.size()
      })
    }

    if (data && data.length > 0) {
      pbn.Data = data
    } else {
      pbn.Data = new Buffer()
    }
    return pbn
  }
}
// Link represents an IPFS Merkle DAG Link between Nodes.
var Link = function (linkName, linkSize, linkHash, linkNode) {
  var name
  var size
  var hash
  var node
  this.name = function () {
    if (arguments.length === 0) {
      return name
    } else {
      if (typeof arguments[0] === 'string') {
        name = arguments[0]
      }
      return this
    }
  }
  this.size = function () {
    if (arguments.length === 0) {
      return size
    } else {
      if (typeof arguments[0] === 'number') {
        size = arguments[0]
      }
      return this
    }
  }
  this.hash = function () {
    if (arguments.length === 0) {
      return hash
    } else {
      if (arguments[0] instanceof Buffer) {
        hash = arguments[0]
      }
      return this
    }
  }

  this.node = function () {
    if (arguments.length === 0) {
      return node
    } else {
      if (arguments[0] instanceof Node) {
        node = arguments[0]
      }
      return this
    }
  }
  this.name(linkName)
  this.size(linkSize)
  this.hash(linkHash)
  this.node(linkNode)
}
module.exports.Link = Link
module.exports.Node = Node
