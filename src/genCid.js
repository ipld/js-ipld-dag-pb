'use strict'

const CID = require('cids')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')

const codec = multicodec.DAG_PB
const defaultHashAlg = multicodec.SHA2_256

/**
 * @typedef {object} GenCIDOptions - Options to create the CID
 * @property {CID.CIDVersion} [cidVersion=1] - CID version number
 * @property {multicodec.CodecNumber} [hashAlg=multicodec.SHA2_256] - Defaults to the defaultHashAlg of the format
 */

/**
 * Calculate the CID of the binary blob.
 *
 * @param {Uint8Array} binaryBlob - Encoded IPLD Node
 * @param {GenCIDOptions} [userOptions] - Options to create the CID
 */
const cid = async (binaryBlob, userOptions = {}) => {
  const options = {
    cidVersion: userOptions.cidVersion == null ? 1 : userOptions.cidVersion,
    hashAlg: userOptions.hashAlg || defaultHashAlg
  }

  // @ts-ignore - according to the types, multihashing takes a string, we have a number
  // though it will convert it internally
  const multihash = await multihashing(binaryBlob, options.hashAlg)
  const codecName = multicodec.print[codec]
  const cid = new CID(options.cidVersion, codecName, multihash)

  return cid
}

module.exports = {
  codec,
  defaultHashAlg,
  cid
}
