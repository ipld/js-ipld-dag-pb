var BlockService = require('./block-service')
var DAGNode = require('./dag-node').DAGNode
var Block = require('./block')
exports = module.exports
exports.DAGService = DAGService
exports.Batch = Batch

function DAGService (bs) {
  var blocks

  this.blocks = function () {
    if (arguments.length === 0) {
      return blocks
    } else {
      if (arguments[0] instanceof BlockService) {
        blocks = arguments[0]
      }
      return this
    }
  }
  this.add = function (node, cb) {
    if (!node || !(node instanceof DAGNode)) {
      return cb('Node is invalid')
    }
    if (!blocks) {
      return cb('Blockservice is invalid')
    }
    var data = node.encoded()

    if (!data) {
      return 'Node is unencoded'
    }

    var block = new Block(data)

    return blocks.addBlock(block, cb)
  }

  this.get = function (key, cb) {
    if (!key) {
      return cb('Invalid Key')
    }

    if (!blocks) {
      return cb('Blockservice is invalid')
    }

    blocks.getBlock(key, function (err, block) {
      if (err) {
        return cb(err)
      }
      var node = new DAGNode()
      node.unMarshal(block.data)
      return cb(null, node)
    })
  }
  // Fetches all nodes in a graph then sets the node property of each link to its correct node
  this.getRecursive = function (key, cb, linkStack, nodeStack) {
    var self = this
    this.get(key, function (err, node) {
      if (err) {
        cb(err)
      }
      if (!linkStack) {
        linkStack = []
      }
      if (!nodeStack) {
        nodeStack = []
      }
      nodeStack.push(node)

      var keys = []
      for (var i = 0; i < node.links.length; i++) {
        var link = node.links[i]
        keys.push(link.hash.toString('hex'))
      }
      linkStack = linkStack.concat(keys)

      var next = linkStack.pop()

      if (next) {
        self.getRecursive(next, cb, linkStack, nodeStack)
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

  // this diverges from go-ipfs this is a non recursive remove function
  this.remove = function (key, cb) {
    if (!key) {
      return cb('Invalid Key')
    }

    if (!blocks) {
      return cb('Blockservice is invalid')
    }

    return blocks.deleteBlock(key, cb)
  }

  this.batch = function () {
    return new Batch(this, 8 * 1024 * 1024)
  }

  this.blocks(bs)
}

function Batch (ds, max) {
  if (!ds) {
    throw Error('Invalid DAG Service')
  }
  this.dagService = ds
  this.blocks = []
  this.size = 0
  this.maxSize = max || 0

  this.add = (node, cb) => {
    if (!node) {
      return cb('Node is invalid')
    }

    var data = node.encoded()

    if (!data) {
      return cb('Node is unencoded')
    }
    this.size += data.length
    var block = new Block(data)
    this.blocks.push(block)
    if (this.size > this.maxSize) {
      this.commit(cb, block.key)
    } else {
      cb(null, block.key)
    }
  }
  this.commit = (cb, key) => {
    var self = this
    this.dagService.blocks().addBlocks(this.blocks, function (err) {
      if (err) {
        return cb(err)
      }
      self.blocks = []
      self.size = 0
      cb(null, key)
    })
  }
}
