'use strict'

const Block = require('ipfs-block')
const isIPFS = require('is-ipfs')
const pull = require('pull-stream')
const mh = require('multihashes')
const traverse = require('pull-traverse')

const DAGNode = require('./dag-node')

module.exports = class DAGService {
  constructor (blockService) {
    if (!blockService) {
      throw new Error('DAGService requires a BlockService instance')
    }

    this.bs = blockService
  }

  // add a DAGNode to the service, storing it on the block service
  put (node, callback) {
    callback = callback || (() => {})
    pull(
      pull.values([node]),
      this.putStream(callback)
    )
  }

  putStream (callback) {
    return pull(
      pull.map((node) => new Block(node.encoded())),
      this.bs.putStream(),
      pull.onEnd(callback)
    )
  }

  // get retrieves a DAGNode, using the Block Service
  get (key, callback) {
    pull(
      this.getStream(key),
      pull.collect((err, res) => {
        if (err) return callback(err)
        callback(null, res[0])
      })
    )
  }

  getStream (key) {
    const normalizedKey = normalizeKey(key)

    if (!normalizedKey) {
      return pull.error(new Error('Invalid Key'))
    }

    return pull(
      this.bs.getStream(normalizedKey),
      pull.map((block) => {
        const node = new DAGNode()
        node.unMarshal(block.data)
        return node
      })
    )
  }

  getRecursive (key, cb) {
    pull(
      this.getRecursiveStream(key),
      pull.collect(cb)
    )
  }

  // Fetches a node and all of the nodes on its links recursively
  // TODO: add depth param
  getRecursiveStream (multihash) {
    return pull(
      this.getStream(multihash),
      pull.map((node) => traverse.widthFirst(node, (node) => {
        return pull(
          pull.values(node.links),
          pull.map((link) => this.getStream(link.hash)),
          pull.flatten()
        )
      })),
      pull.flatten()
    )
  }

  // remove deletes a node with given multihash from the blockService
  remove (multihash, cb) {
    if (!multihash) {
      return cb(new Error('Invalid multihash'))
    }

    this.bs.delete(multihash, cb)
  }
}

function normalizeKey (key) {
  let res
  const isMhash = isIPFS.multihash(key)
  const isPath = isIPFS.path(key)

  if (!isMhash && !isPath) {
    return null
  }

  if (isMhash) {
    res = key
  } else if (isPath) {
    res = key.replace('/ipfs/', '')
  }

  if (typeof res === 'string') {
    return mh.fromB58String(res)
  }

  return res
}
