'use strict'

const CID = require('cids')
const proto = require('./dag.proto.js')
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
    const msg = proto.PBNode.create(toProtoBuf(node))
    serialized = proto.PBNode.encode(msg).finish()
  } catch (err) {
    return callback(err)
  }

  callback(null, Buffer.from(serialized))
}

function deserialize (data, callback) {
  const pbn = proto.PBNode.decode(data)

  const links = pbn.Links.map((link) => {
    const size = typeof link.Tsize.toNumber === 'function' ? link.Tsize.toNumber() : link.Tsize
    return new DAGLink(link.Name, size, Buffer.from(link.Hash))
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
