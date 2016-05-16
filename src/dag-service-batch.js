'use strict'

const Block = require('ipfs-block')

// Batch is to defer writes
module.exports = class Batch {
  constructor (ds, max) {
    if (!ds) {
      throw Error('Invalid DAG Service')
    }

    this.dagService = ds
    this.blocks = []
    this.size = 0
    this.maxSize = max || 0
  }

  add (node, cb) {
    if (!node) {
      return cb('Node is invalid')
    }

    const data = node.encoded()

    if (!data) {
      return cb('Node is unencoded')
    }

    this.size += data.length
    const block = new Block(data)
    this.blocks.push(block)

    if (this.size > this.maxSize) {
      this.commit(cb, block.key)
    } else {
      cb(null, block.key)
    }
  }

  commit (cb, key) {
    this.dagService.blocks().addBlocks(this.blocks, (err) => {
      if (err) {
        return cb(err)
      }

      this.blocks = []
      this.size = 0
      cb(null, key)
    })
  }
}
