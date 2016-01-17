var util = require('./util')
var Block = require('./block')
if (util.isBrowser()) {
  window.Buffer = require('buffer/').Buffer
}

// BlockService is a hybrid block datastore. It stores data in a local
// datastore and may retrieve data from a remote Exchange.
// It uses an internal `datastore.Datastore` instance to store values.
var BlockService = function (ipfsRepo, exchange) {
  this.addBlock = function (block, cb) {
    if (!(block instanceof Block)) {
      if (cb && typeof cb === 'function') {
        return cb('Invalid block')
      }
    }

    ipfsRepo.datastore.exists({ key: block.key.toString('hex') }, function (err, exists) {
      if (err) { return cb(err) }
      if (exists) {
        return cb()
      } else {
        var ws = ipfsRepo.datastore.createWriteStream({ key: block.key.toString('hex') })
        ws.write(block.data, cb)
        ws.end()
      }
    })
  }
  this.addBlocks = function (blocks, cb) {
    if (!Array.isArray(blocks)) {
      return cb('Invalid batch of blocks')
    }
    var i = 0
    var block
    if (i < blocks.length) {
      block = blocks[i]
    }
    var self = this
    var next = function (err) {
      if (err) {
        return cb(err)
      } else {
        i++
        if (i < blocks.length) {
          block = blocks[i]
          self.addBlock(block, next)
        } else {
          return cb()
        }
      }
    }
    this.addBlock(block, next)
  }

  this.getBlock = function (key, cb) {
    if (!key || (typeof key !== 'string')) {
      return cb('Invalid key')
    }
    ipfsRepo.datastore.exists({ key: key }, function (err, exists) {
      if (err) {
        return cb(err)
      }
      if (exists) {
        var data = new Buffer(0)
        var rs = ipfsRepo.datastore.createReadStream({key: key})
        rs.on('readable', function () {
          var chunk
          while ((chunk = rs.read()) != null) {
            data = Buffer.concat([data, chunk])
          }
        })
        rs.on('end', function () {
          var block = new Block(data)
          return cb(null, block)
        })
      }
    })
  }
  this.getBlocks = function (keys, cb) {
    if (!Array.isArray(keys)) {
      return cb('Invalid batch of keys')
    }
    var i = 0
    var key
    var blocks = []
    if (i < keys.length) {
      key = keys[i]
    }
    var self = this
    var next = function (err, block) {
      if (err) {
        return cb(err, blocks)
      } else {
        blocks.push(block)
        i++
        if (i < keys.length) {
          key = keys[i]
          self.getBlock(key, next)
        } else {
          return cb(null, blocks)
        }
      }
    }
    this.getBlock(key, next)
  }
  this.deleteBlock = function (key, cb) {
    if (!key || (typeof key !== 'string')) {
      return cb('Invalid key')
    }
    ipfsRepo.datastore.exists({ key: key }, function (err, exists) {
      if (err) {
        return cb(err)
      }
      if (exists) {
        ipfsRepo.datastore.remove({key: key}, cb)
      }
    })
  }

  this.deleteBlocks = function (keys, cb) {
    if (!Array.isArray(keys)) {
      return cb('Invalid batch of keys')
    }
    var i = 0
    var key
    var blocks = []
    if (i < keys.length) {
      key = keys[i]
    }
    var self = this
    var next = function (err, block) {
      if (err) {
        return cb(err, blocks)
      } else {
        blocks.push(block)
        i++
        if (i < keys.length) {
          key = keys[i]
          self.deleteBlock(key, next)
        } else {
          return cb(null, blocks)
        }
      }
    }
    this.deleteBlock(key, next)
  }
}
module.exports = BlockService
