'use strict'

const CID = require('cids')
const protons = require('protons')
const proto = protons(require('./dag.proto.js'))
const DAGLink = require('./dag-link')
const DAGNode = require('./dag-node')

exports = module.exports

function cid (node, callback) {
  if (node.multihash) {
    return callback(null, new CID(node.multihash))
  }
  callback(new Error('not valid dagPB node'))
}

function serialize (node, callback) {
  let serialized

  // If the node is not an instance of a DAGNode, the link.hash might be a Base58 encoded string; decode it
  if (node.constructor.name !== 'DAGNode' && node.links) {
    node.links = node.links.map((link) => {
      return DAGLink.util.isDagLink(link) ? link : DAGLink.util.createDagLinkFromB58EncodedHash(link)
    })
  }

  try {
    serialized = proto.PBNode.encode(toProtoBuf(node))
  } catch (err) {
    return callback(err)
  }

  callback(null, serialized)
}

function deserialize (data, callback) {
  const pbn = proto.PBNode.decode(data)

  const links = pbn.Links.map((link) => {
    return new DAGLink(link.Name, link.Tsize, link.Hash)
  })

  const buf = pbn.Data == null ? Buffer.alloc(0) : Buffer.from(pbn.Data)

  DAGNode.create(buf, links, callback)
}

function toProtoBuf (node) {
  const pbn = {}

  if (node.data && node.data.length > 0) {
    pbn.Data = node.data
  } else {
    // NOTE: this has to be null in order to match go-ipfs serialization `null !== new Buffer(0)`
    pbn.Data = null
  }

  if (node.links && node.links.length > 0) {
    pbn.Links = node.links.map((link) => {
      return {
        Hash: link.multihash,
        Name: link.name,
        Tsize: link.size
      }
    })
  } else {
    pbn.Links = null
  }

  return pbn
}

exports.serialize = serialize
exports.deserialize = deserialize
exports.cid = cid
