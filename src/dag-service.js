var DAGNode = require('./dag-node').DAGNode
var Block = require('ipfs-blocks').Block

exports = module.exports = DAGService

function DAGService (blockService) {
  if (!blockService) {
    throw new Error('DAGService requires a BlockService instance')
  }

  this.bs = blockService

  // add a DAGNode to the service, storing it on the block service
  this.add = (node, callback) => {
    var data = node.encoded()

    var block = new Block(data)

    this.bs.addBlock(block, callback)
  }

  // DEPRECATED - https://github.com/ipfs/go-ipfs/issues/2262
  // this.addRecursive

  // get retrieves a DAGNode, using the Block Service
  this.get = (key, callback) => {
    if (!key) { return callback(new Error('Invalid Key')) }

    this.bs.getBlock(key, function (err, block) {
      if (err) { return callback(err) }
      var node = new DAGNode()
      node.unMarshal(block.data)
      return callback(null, node)
    })
  }

  // getRecursive fetches a node and all of the nodes on its links recursively
  // TODO add depth param
  this.getRecursive = (key, cb, linkStack, nodeStack) => {
    this.get(key, function (err, node) {
      if (err) { return cb(err) }

      if (!linkStack) { linkStack = [] }
      if (!nodeStack) { nodeStack = [] }

      nodeStack.push(node)

      var keys = []
      for (var i = 0; i < node.links.length; i++) {
        var link = node.links[i]
        keys.push(link.hash.toString('hex'))
      }
      linkStack = linkStack.concat(keys)

      var next = linkStack.pop()

      if (next) {
        this.getRecursive(next, cb, linkStack, nodeStack)
      } else {
        for (var k = 0; k < nodeStack.length; k++) {
          var current = nodeStack[k]
          for (var j = 0; j < current.links.length; j++) {
            link = current.links[j]
            var index = nodeStack.findIndex(function (node) {
              return node.key().equals(link.hash)
            })
            if (index !== -1) {
              link.node = nodeStack[index]
            }
          }
        }
        return cb(null, nodeStack[0])
      }
    })
  }

  // remove deletes a node with given key from the blockService
  this.remove = (key, cb) => {
    if (!key) { return cb(new Error('Invalid Key')) }

    this.bs.deleteBlock(key, cb)
  }

  // DEPRECATED - https://github.com/ipfs/go-ipfs/issues/2262
  // this.removeRecursive = function (key, callback) { }
}
