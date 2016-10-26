'use strict'

const multihashing = require('multihashing-async')
const CID = require('cids')
const stable = require('stable')
const protobuf = require('protocol-buffers')
const proto = protobuf(require('./dag.proto'))

const DAGNode = require('./dag-node')
const DAGLink = require('./dag-link')

exports = module.exports

// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
exports.hash = (type, data, cb) => multihashing(data, type, cb)

exports.linkSort = (a, b) => {
  return (new Buffer(a.name || '', 'ascii').compare(new Buffer(b.name || '', 'ascii')))
}

exports.toProtoBuf = (node) => {
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

exports.serialize = (dagNode, callback) => {
  let serialized

  try {
    const pb = exports.toProtoBuf(dagNode)
    serialized = proto.PBNode.encode(pb)
  } catch (err) {
    return callback(err)
  }

  callback(null, serialized)
}

exports.deserialize = (data, callback) => {
  const pbn = proto.PBNode.decode(data)

  const links = pbn.Links.map((link) => {
    return new DAGLink(link.Name, link.Tsize, link.Hash)
  })

  stable.inplace(links, exports.linkSort)

  const buf = pbn.Data || new Buffer(0)

  const dagNode = new DAGNode(buf, links)

  callback(null, dagNode)
}

exports.cid = (dagNode, callback) => {
  dagNode.multihash((err, multihash) => {
    if (err) {
      return callback(err)
    }
    const cid = new CID(multihash)
    callback(null, cid)
  })
}

