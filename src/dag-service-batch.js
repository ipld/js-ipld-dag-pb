var Block = require('ipfs-blocks').Block

exports = module.exports = Batch

// Batch is to defer writes
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
