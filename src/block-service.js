var Block = require('./block')
var bl = require('bl')
var async = require('async')

// BlockService is a hybrid block datastore. It stores data in a local
// datastore and may retrieve data from a remote Exchange.
// It uses an internal `datastore.Datastore` instance to store values.
function BlockService (ipfsRepo, exchange) {
  this.addBlock = addBlock
  function addBlock (block, cb) {
    var ws = ipfsRepo.datastore.createWriteStream(block.key)
    ws.write(block.data)
    ws.on('finish', cb)
    ws.end()
  }

  this.addBlocks = function (blocks, cb) {
    if (!Array.isArray(blocks)) {
      return cb(new Error('expects an array of Blocks'))
    }

    async.each(blocks, function (block, next) {
      addBlock(block, next)
    }, function (err) {
      cb(err)
    })
  }

  this.getBlock = getBlock
  function getBlock (multihash, cb) {
    if (!multihash) {
      return cb(new Error('Invalid multihash'))
    }

    ipfsRepo.datastore.createReadStream(multihash)
      .pipe(bl(function (err, data) {
        if (err) {
          return cb(err)
        }
        cb(null, new Block(data))
      }))
  }

  this.getBlocks = function (multihashes, cb) {
    if (!Array.isArray(multihashes)) {
      return cb(new Error('Invalid batch of multihashes'))
    }

    var blocks = []
    async.each(multihashes, function (multihash, next) {
      getBlock(multihash, function (err, block) {
        if (err) {
          return next(err)
        }
        blocks.push(block)
      })
    }, function (err) {
      cb(err, blocks)
    })
  }

  this.deleteBlock = deleteBlock
  function deleteBlock (multihash, cb) {
    if (!multihash) {
      return cb(new Error('Invalid multihash'))
    }

    ipfsRepo.datastore.remove(multihash, cb)
  }

  this.deleteBlocks = function (multihashes, cb) {
    if (!Array.isArray(multihashes)) {
      return cb('Invalid batch of multihashes')
    }

    async.each(multihashes, function (multihash, next) {
      deleteBlock(multihash, next)
    }, function (err) {
      cb(err)
    })
  }
}
module.exports = BlockService
