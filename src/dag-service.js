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
      node.unMarshal(block.data)
      return cb(null, node)
    })
  }

  this.getRecursive = function (key, cb, linkStack, nodeStack) {
     this.get(key, function(err, node){
       if(err){
         cb(err)
       }
       if(!linkStack){
         linkStack=[]
       }
       if(!nodeStack){
         linkStack=[]
       }
       nodeStack.push(node)
       var keys= []
       for(link in node.links){
         keys.push(link.hash.toString('hex'))
       }
       linkStack= linkStack.concat(keys)

       var next= linkStack.pop()
       if (next){
         this.getRecursive(next, cb, linkStack, nodeStack)
       } else {
         for(var i; i < nodeStack.length; i++){
           var current= nodesStack[i]
           for(var j; j < current.links.length; j++){
             var link= current.links[j]
             var index = nodeStack.findIndex(function(node){
                 return node.key()== link.hash
             })
             if(index != -1){
               link.node=nodeStack[index];
             }
           }
         }
         return cb(null, nodeStack[0])

       }

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

  this.Blocks(bs)
}
