var Block = require('./block')
var bl = require('bl')

// BlockService is a hybrid block datastore. It stores data in a local
// datastore and may retrieve data from a remote Exchange.
// It uses an internal `datastore.Datastore` instance to store values.
function BlockService (ipfsRepo, exchange) {
  this.addBlock = addBlock
  function addBlock (block, cb) {
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
      return cb(new Error('Invalid batch of blocks'))
    }

    var i = 0
    var block
    if (i < blocks.length) {
      block = blocks[i]
    }

    function next (err) {
      if (err) {
        return cb(err)
      } else {
        i++
        if (i < blocks.length) {
          block = blocks[i]
          addBlock(block, next)
        } else {
          return cb()
        }
      }
    }

    addBlock(block, next)
  }

  this.getBlock = getBlock
  function getBlock (key, cb) {
    if (!key || (typeof key !== 'string')) {
      return cb(new Error('Invalid key'))
    }

    // TODO remove unnecessary call
    // createReadStream emits an error in case a block doesn't exist,
    // meaning that this call isn't really necessary
    ipfsRepo.datastore.exists({ key: key }, function (err, exists) {
      if (err) {
        return cb(err)
      }

      if (exists) {
        ipfsRepo.datastore.createReadStream({key: key})
          .pipe(bl(function (err, data) {
            if (err) {
              return cb(err)
            }
            cb(null, new Block(data))
          }))
      }
    })
  }

  this.getBlocks = function (keys, cb) {
    if (!Array.isArray(keys)) {
      return cb(new Error('Invalid batch of keys'))
    }
    var i = 0
    var key
    var blocks = []

    if (i < keys.length) {
      key = keys[i]
    }

    function next (err, block) {
      if (err) {
        return cb(err, blocks)
      } else {
        // if (block) {
        blocks.push(block)
        // }
        i++
        if (i < keys.length) {
          key = keys[i]
          getBlock(key, next)
        } else {
          return cb(null, blocks)
        }
      }
    }

    getBlock(key, next)
  }

  this.deleteBlock = deleteBlock
  function deleteBlock (key, cb) {
    if (!key || (typeof key !== 'string')) {
      return cb(new Error('Invalid key'))
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

    function next (err, block) {
      if (err) {
        return cb(err, blocks)
      } else {
        blocks.push(block)
        i++
        if (i < keys.length) {
          key = keys[i]
          deleteBlock(key, next)
        } else {
          return cb(null, blocks)
        }
      }
    }
    deleteBlock(key, next)
  }
}
module.exports = BlockService
