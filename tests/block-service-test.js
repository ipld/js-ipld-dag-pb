var test = require('tape')
var Block = require('../src').Block
var BlockService = require('../src').BlockService

var IPFSRepo = require('ipfs-repo')

test('block-service: \t test blockservice', function (t) {
  var repo = new IPFSRepo(require('./index.js').repoPath)

  var blockService = new BlockService(repo)

  var block1 = new Block('You can\'t change me,  Baby I was born this way!')
  var block2 = new Block('Another useless test block')
  var block3 = new Block('A different useless test block')
  var block4 = new Block('An enterprising test block with dreams')
  var blocks = [block2, block3, block4]
  var keys = [block2.key.toString('hex'), block3.key.toString('hex'), block4.key.toString('hex')]

  function addOneCb (err) {
    t.ifError(err, 'Add a block wihout error')
    blockService.getBlock(block1.key.toString('hex'), getOneCb)
  }

  function getOneCb (err, obj) {
    t.ifError(err, 'Get a block without error')
    t.is(obj instanceof Block, true, 'Is it really a block?')
    t.is(obj.key.equals(block1.key), true, 'Is it really the same block?')
    blockService.addBlocks(blocks, addManyCb)
  }
  var addManyCb = function (err) {
    t.ifError(err, 'Added many blocks without error')
    blockService.getBlocks(keys, getManyCb)
  }
  var getManyCb = function (err, obj) {
    t.ifError(err, 'Got many blocks without error')
    t.is(Array.isArray(obj), true, 'Is it really an array?')
    t.equal(keys.length, obj.length, 'Is it the amount we expect?')
    var found
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      found = obj.find(function (block) {
        return key === block.key.toString('hex')
      })
      t.ok(found, 'Found correct key in the response')
    }
    blockService.deleteBlock(block1.key.toString('hex'), deleteOneCb)
  }
  var deleteOneCb = function (err, exist) {
    t.ifError(err, 'Failed to delete block?')
    repo.datastore.exists(block1.key.toString('hex'), function (err, exists) {
      t.ifErr(err, 'Failed to check if block exists')
      t.is(exists, false, 'Block was deleted')
      blockService.deleteBlocks(keys, deleteManyCb)
    })
  }
  var deleteManyCb = function (err, obj) {
    t.ifError(err, 'Failed to delete blocks?')
  }

  blockService.addBlock(block1, addOneCb)

  t.end()
})
