'use strict'

const CID = require('cids')
const mergeOptions = require('merge-options')
const protons = require('protons')
const proto = protons(require('./dag.proto.js'))
const DAGLink = require('./dag-link')
const DAGNode = require('./dag-node')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')

exports = module.exports

exports.format = multicodec.DAG_PB
exports.defaultHashAlg = multicodec.SHA2_256

/**
 * Calculate the CID of the binary blob.
 *
 * @param {Object} binaryBlob - Internal representation
 * @param {Object} [userOptions] - Options to create the CID
 * @param {number} [userOptions.cidVersion] - CID version number. Defaults to zero if hashAlg == 'sha2-256'; otherwise, 1.
 * @param {string} [UserOptions.hashAlg] - Defaults to hashAlg for the resolver
 * @returns {Promise.<CID>}
 */
const cid = async (binaryBlob, userOptions) => {
  const defaultOptions = { cidVersion: 1, hashAlg: exports.defaultHashAlg }
  const options = mergeOptions(defaultOptions, userOptions)

  return new Promise((resolve, reject) => {
    multihashing(binaryBlob, options.hashAlg, (error, multihash) => {
      if (error) {
        return reject(error)
      }
      const formatName = multicodec.print[exports.format]
      const cid = new CID(options.cidVersion, formatName, multihash)
      return resolve(cid)
    })
  })
}

const serialize = async (node) => {
  let data = node.Data
  let links = node.Links || []

  // If the node is not an instance of a DAGNode, the link.hash might be a Base58 encoded string; decode it
  if (!DAGNode.isDAGNode(node) && links) {
    links = links.map((link) => {
      return DAGLink.isDAGLink(link) ? link : DAGLink.util.createDagLinkFromB58EncodedHash(link)
    })
  }

  const serialized = proto.PBNode.encode(toProtoBuf({
    Data: data,
    Links: links
  }))

  return Uint8Array.from(serialized)
}

const deserialize = async (buffer) => {
  const pbn = proto.PBNode.decode(Buffer.from(buffer))

  const links = pbn.Links.map((link) => {
    return new DAGLink(link.Name, link.Tsize, link.Hash)
  })

  const data = pbn.Data == null ? Buffer.alloc(0) : pbn.Data

  return new DAGNode(data, links, buffer.length)
}

function toProtoBuf (node) {
  const pbn = {}

  if (node.Data && node.Data.length > 0) {
    pbn.Data = node.Data
  } else {
    // NOTE: this has to be null in order to match go-ipfs serialization `null !== new Buffer(0)`
    pbn.Data = null
  }

  if (node.Links && node.Links.length > 0) {
    pbn.Links = node.Links
      .map((link) => ({
        Hash: link.Hash.buffer,
        Name: link.Name,
        Tsize: link.Tsize
      }))
  } else {
    pbn.Links = null
  }

  return pbn
}

exports.serialize = serialize
exports.deserialize = deserialize
exports.cid = cid
