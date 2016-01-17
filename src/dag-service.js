var BlockService = require('./block-service')
var Node = require('./dag-node')
var Block = require('./block')

exports = module.exports = DAGService

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
    if (!node || !(node instanceof Node)) {
      return cb('Node is invalid')
    }
    if (!blocks) {
      return cb('Blockservice is invalid')
    }
    var data = node.Encoded()

    if (!data) {
      return 'Node is unencoded'
    }

    var block = new Block(data)

    return blocks.addBlock(block, cb)
  }

  // Deprecation Notice: This method is a leftovers from the early versions of IPFS and is not used anymore
  //
  // this.addRecursive = function (node, cb) {
  //  this.add(node, function (err) {
  //    if (err) {
  //      return cb(err)
  //    }
  //    var links = node.Links()
  //    var i = 0
  //    var link
  //    var self = this
  //    var next = function (err) {
  //      if (err) {
  //        return cb(err)
  //      }
  //      i++
  //      if (i < links.length) {
  //        link = links[i]
  //        if (link.Node()) {
  //          return self.addRecursive(link.Node(), next)
  //        }
  //      } else {
  //        return cb()
  //      }
  //    }
  //    if (i < links.length) {
  //      link = links[i]
  //      if (link.Node()) {
  //        return self.addRecursive(link.Node(), next)
  //      }
  //    } else {
  //      return cb()
  //    }
  //  })
  // }

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
      var node = new Node()
      node.data(block.data())
      return cb(null, node)
    })
  }

  // this diverges from go-ipfs this is a non recursive remove function
  this.remove = function (node, cb) {
    if (!node || !(node instanceof Node)) {
      return cb('Node is invalid')
    }

    if (!blocks) {
      return cb('Blockservice is invalid')
    }

    var data = node.Encoded()
    if (!data) {
      return 'Node is unencoded'
    }

    var block = new Block(data)
    return blocks.remove(block, cb)
  }

  // Deprecation Notice: This method is a leftovers from the early versions of IPFS and is not used anymore
  //
  // this.removeRecursive = function (node, cb) {
  //   var links = node.Links()
  //   var i = 0
  //   var link
  //   var self = this
  //   var next = function (err) {
  //     if (err) {
  //       return cb(err)
  //     }
  //     i++
  //     if (i < links.length) {
  //       link = links[i]
  //       if (link.Node()) {
  //         return self.removeRecursive(link.Node(), next)
  //       }
  //     } else {
  //       return self.remove(node, cb)
  //     }
  //   }
  //   if (i < links.length) {
  //     link = links[i]
  //     if (link.Node()) {
  //       return self.removeRecursive(link.Node(), next)
  //     }
  //   } else {
  //     return self.remove(node, cb)
  //   }
  // }

  this.Blocks(bs)
}
