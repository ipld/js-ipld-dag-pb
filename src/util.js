'use strict'

const multihashing = require('multihashing')
const CID = require('cids')
const stable = require('stable')
const protobuf = require('protocol-buffers')
const fs = require('fs')
const path = require('path')
const proto = protobuf(fs.readFileSync(path.join(__dirname, 'dag.proto')))

const DAGNode = require('./dag-node')
const DAGLink = require('./dag-link')

exports = module.exports

// Hash is the global IPFS hash function. uses multihash SHA2_256, 256 bits
exports.hash = (data) => multihashing(data, 'sha2-256')

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

exports.serialize = (dagNode) => {
  return proto.PBNode.encode(exports.toProtoBuf(dagNode))
}

exports.deserialize = (data) => {
  const pbn = proto.PBNode.decode(data)

  const links = pbn.Links.map((link) => {
    return new DAGLink(link.Name, link.Tsize, link.Hash)
  })

  stable.inplace(links, exports.linkSort)

  const buf = pbn.Data || new Buffer(0)

  const dagNode = new DAGNode(buf, links)

  return dagNode
}

exports.cid = (dagNode) => {
  return new CID(dagNode.multihash())
}

