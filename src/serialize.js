'use strict'

const protobuf = require('protobufjs/light')
// @ts-ignore
const json = require('./dag.json')
const root = protobuf.Root.fromJSON(json)
const PBNode = root.lookupType('PBNode')
const {
  createDagLinkFromB58EncodedHash
} = require('./dag-link/util')

/**
 * @typedef {import('./dag-link/dagLink')} DAGLink
 * @typedef {import('./dag-link/dagLink').DAGLinkLike} DAGLinkLike
 * @typedef {import('cids')} CID
 */

/**
 * @param { { Data?: Uint8Array, Links: Array<{ Hash: CID, Name: string, Tsize: number }> }} node
 */
const toProtoBuf = (node) => {
  const pbn = {}

  if (node.Data && node.Data.byteLength > 0) {
    pbn.Data = node.Data
  } else {
    // NOTE: this has to be null in order to match go-ipfs serialization
    // `null !== new Uint8Array(0)`
    pbn.Data = null
  }

  if (node.Links && node.Links.length > 0) {
    pbn.Links = node.Links
      .map((link) => ({
        Hash: link.Hash.bytes,
        Name: link.Name,
        Tsize: link.Tsize
      }))
  } else {
    pbn.Links = null
  }

  return pbn
}

/**
 * Serialize internal representation into a binary PB block.
 *
 * @param {import('./dag-node/dagNode')} node - Internal representation of a PB block
 */
const serializeDAGNode = (node) => {
  return PBNode.encode(toProtoBuf(node)).finish()
}

/**
 * Serialize an object where the `Links` might not be a `DAGLink` instance yet
 *
 * @param {Uint8Array} [data]
 * @param {(DAGLink | string | DAGLinkLike)[]} [links]
 */
const serializeDAGNodeLike = (data, links = []) => {
  const node = {
    Data: data,
    Links: links.map((link) => {
      return createDagLinkFromB58EncodedHash(link)
    })
  }

  return PBNode.encode(toProtoBuf(node)).finish()
}

module.exports = {
  serializeDAGNode,
  serializeDAGNodeLike
}
