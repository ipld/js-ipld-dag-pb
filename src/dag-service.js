'use strict'

const Block = require('ipfs-block')
const isIPFS = require('is-ipfs')
const base58 = require('bs58')

const DAGNode = require('./dag-node')

module.exports = class DAGService {
  constructor (blockService) {
    if (!blockService) {
      throw new Error('DAGService requires a BlockService instance')
    }

    this.bs = blockService
  }

  // add a DAGNode to the service, storing it on the block service
  add (node, callback) {
    this.bs.addBlock(new Block(node.encoded()), callback)
  }

  // DEPRECATED - https://github.com/ipfs/go-ipfs/issues/2262
  // this.addRecursive

  // get retrieves a DAGNode, using the Block Service
  get (multihash, callback) {
    const isMhash = isIPFS.multihash(multihash)
    const isPath = isIPFS.path(multihash)

    if (!isMhash && !isPath) {
      return callback(new Error('Invalid Key'))
    }

    if (isMhash) {
      this.getWith(multihash, callback)
    }

    if (isPath) {
      const ipfsKey = multihash.replace('/ipfs/', '')
      this.getWith(ipfsKey, callback)
    }
  }

  getWith (key, callback) {
    const formatted = typeof key === 'string' ? new Buffer(base58.decode(key)) : key
    this.bs.getBlock(formatted, (err, block) => {
      if (err) {
        return callback(err)
      }

      const node = new DAGNode()
      node.unMarshal(block.data)
      return callback(null, node)
    })
  }

  // getRecursive fetches a node and all of the nodes on its links recursively
  // TODO add depth param
  getRecursive (multihash, callback, linkStack, nodeStack) {
    this.get(multihash, (err, node) => {
      if (err && nodeStack.length > 0) {
        return callback(new Error('Could not complete the recursive get'), nodeStack)
      }
      if (err) {
        return callback(err)
      }

      if (!linkStack) { linkStack = [] }
      if (!nodeStack) { nodeStack = [] }

      nodeStack.push(node)

      const keys = node.links.map((link) => {
        return link.hash
      })

      linkStack = linkStack.concat(keys)

      const next = linkStack.pop()

      if (next) {
        this.getRecursive(next, callback, linkStack, nodeStack)
      } else {
        const compare = (hash) => (node) => {
          node.multihash().equals(hash)
        }

        let link
        for (let k = 0; k < nodeStack.length; k++) {
          const current = nodeStack[k]
          for (let j = 0; j < current.links.length; j++) {
            link = current.links[j]
            const index = nodeStack.findIndex(compare(link.hash))
            if (index !== -1) {
              link.node = nodeStack[index]
            }
          }
        }
        return callback(null, nodeStack)
      }
    })
  }

  // remove deletes a node with given multihash from the blockService
  remove (multihash, cb) {
    if (!multihash) {
      return cb(new Error('Invalid multihash'))
    }

    this.bs.deleteBlock(multihash, cb)
  }

  // DEPRECATED - https://github.com/ipfs/go-ipfs/issues/2262
  // this.removeRecursive = (key, callback) => { }
}
