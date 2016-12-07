'use strict'

const CID = require('cids')
const protobuf = require('protocol-buffers')
const proto = protobuf(require('./dag.proto'))
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

  try {
    const pb = toProtoBuf(node)
    serialized = proto.PBNode.encode(pb)
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

  const buf = pbn.Data || new Buffer(0)

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

  if (node.links.length > 0) {
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
