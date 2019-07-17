'use strict'

const CID = require('cids')
const protons = require('protons')
const proto = protons(require('./dag.proto'))
const DAGLink = require('./dag-link/dagLink')
const DAGNode = require('./dag-node/dagNode')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')
const { serializeDAGNode, serializeDAGNodeLike } = require('./serialize')

exports = module.exports

exports.codec = multicodec.DAG_PB
exports.defaultHashAlg = multicodec.SHA2_256

/**
 * Calculate the CID of the binary blob.
 *
 * @param {Object} binaryBlob - Encoded IPLD Node
 * @param {Object} [userOptions] - Options to create the CID
 * @param {number} [userOptions.cidVersion=1] - CID version number
 * @param {string} [UserOptions.hashAlg] - Defaults to the defaultHashAlg of the format
 * @returns {Promise.<CID>}
 */
const cid = async (binaryBlob, userOptions) => {
  const defaultOptions = { cidVersion: 1, hashAlg: exports.defaultHashAlg }
  const options = Object.assign(defaultOptions, userOptions)

  const multihash = await multihashing(binaryBlob, options.hashAlg)
  const codecName = multicodec.print[exports.codec]
  const cid = new CID(options.cidVersion, codecName, multihash)

  return cid
}

/**
 * Serialize internal representation into a binary PB block.
 *
 * @param {Object} node - Internal representation of a CBOR block
 * @returns {Buffer} - The encoded binary representation
 */
const serialize = (node) => {
  if (DAGNode.isDAGNode(node)) {
    return serializeDAGNode(node)
  } else {
    return serializeDAGNodeLike(node.Data, node.Links)
  }
}

/**
 * Deserialize PB block into the internal representation.
 *
 * @param {Buffer} buffer - Binary representation of a PB block
 * @returns {Object} - An object that conforms to the IPLD Data Model
 */
const deserialize = (buffer) => {
  const pbn = proto.PBNode.decode(buffer)

  const links = pbn.Links.map((link) => {
    return new DAGLink(link.Name, link.Tsize, link.Hash)
  })

  const data = pbn.Data == null ? Buffer.alloc(0) : pbn.Data

  return new DAGNode(data, links, buffer.length)
}

exports.serialize = serialize
exports.deserialize = deserialize
exports.cid = cid
