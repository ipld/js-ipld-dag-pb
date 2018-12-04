'use strict'

// const protons = require('protons')
// const proto = protons(require('./dag.proto.js'))
const CID = require('cids')
const mergeOptions = require('merge-options');
const Pbf = require('pbf')
const proto = require('./dag.proto.js')
const multihashing = require('multihashing-async')
const multicodec = require('multicodec')
const DAGLink = require('./dag-link')
const DAGNode = require('./dag-node')

/** Converts a Protocol Buffer decoded node into the format we want.
 *
 * The Protocol Buffers decoder creates an object which hasn't exactly
 * the shape the we want our object to look like, hence transfrom it.
 */
const fromPbRep = (pbNode /*: PBNode */) /*: DapPb */ => {
  const links = pbNode.Links.map((link) => {
    // TODO vmx 2018-12-03: This is a hack, CID should also take an
    // ArrayBuffer/Uint8Array as input
    const hash = Buffer.from(link.Hash)
    // return {
    //   cid: new CID(hash),
    //   name: link.Name,
    //   size: link.Tsize
    // }
    return new DAGLink(link.Name, link.Tsize, hash)
  })

  const data = pbNode.Data === null ? new Uint8Array() : pbNode.Data
  return {
    data,
    links
  }
}

/** Converts a node into a Protocol Buffer compatible representaiton.
 *
 * The Protocol Buffers encoder needs a JavaScript object with certain
 * field names. This function creates such an object out of our object.
 */
const toPbRep = (node /*: DapPb */) /*: Object */ => {
  const pbRep = {}
  if (node.data && node.data.length > 0) {
    pbRep.Data = node.data
  } else {
    // NOTE: this has to be null in order to match go-ipfs serialization
    // `null !== new Buffer(0)`
    pbRep.Data = null
  }

  if (node.links && node.links.length > 0) {
    pbRep.Links = node.links
      .map((link) => {
        // TODO vmx 2018-12-03: This is a hack, it should be possible
        // to get an arraybuffer/unit8arrray from a CID
        const buffer = link.cid.buffer
        const hash = new Uint8Array(buffer.buffer.slice(buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength))
        return {
          Hash: hash,
          Name: link.name,
          Tsize: link.size
        }
      })
  } else {
    pbRep.Links = null
  }

  return pbRep
}

const defaultHashAlg = 0x12
const format = 0x70

// TODO vmx 2018-12-01: GO ON HERE and add the missing APIs.
//   Not adding:
//    - clone: overkill, is it really needed?
const cid = async (
    binaryBlob /*: ArrayBuffer */,
    userOptions /*: {version: number, hashAlg: Multicodec } */
  ) /*: CID */  => {
  const defaultOptions = { version: 1, hashAlg: defaultHashAlg }
  const options = mergeOptions(defaultOptions, userOptions)
  // NOTE vmx 2018-12-01: This is a dirty hack to make things work with the
  // current CID implementation. CID should really take the codec as number
  // and not as string
  const formatName = multicodec.getCodec(Buffer.from([format]))

  return new Promise((resolve, reject) => {
    multihashing(binaryBlob, options.hashAlg, (error, multihash) => {
      if (error) {
        return reject(error)
      }
      const cid = new CID(options.version, formatName, multihash)
      return resolve(cid)
    })
  })
}


const deserialize = async (binaryBlob /*: ArrayBuffer */) /*: DagPb */ => {
  const pbf = new Pbf(binaryBlob)
  const pbRep = proto.PBNode.read(pbf)
  const {data, links} = fromPbRep(pbRep)
  return new DAGNode(data, links, binaryBlob.length)
}

const serialize = async (node /*: DagPb */) /*: ArrayBuffer */ => {
  const pbRep = toPbRep(node)
  const pbf = new Pbf()
  proto.PBNode.write(pbRep, pbf)
  const encoded = pbf.finish()
  return encoded
}


const main = async () => {
  const data = new Uint8Array([0, 1, 2, 3])
  console.log(data)

  const serialized = await serialize({
    data
  })
  console.log(serialized)

  const deserialized = await deserialize(serialized)
  console.log(deserialized)

  const pbcid = await cid(serialized)
  console.log(pbcid)
}

if (require.main === module) {
  main()
}

module.exports = {
  cid,
  defaultHashAlg,
  deserialize,
  format,
  serialize,
}
