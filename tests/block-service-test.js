var test = require('tape')
var Block = require('../src').Block
var BlockService = require('../src').BlockService

var IPFSRepo = require('ipfs-repo')
var bs

test('block-service: \t create a block-service', function (t) {
  var repo = new IPFSRepo(require('./index.js').repoPath)
  bs = new BlockService(repo)
  t.ok(bs, 'block service successfully created')
  t.end()
})

test('block-service: \t store a block', function (t) {
  var b = new Block('A random data block')
  bs.addBlock(b, function (err) {
    t.ifError(err)
    bs.getBlock(b.key, function (err, block) {
      t.ifError(err)
      t.ok(b.data.equals(block.data), 'Stored block data correctly')
      t.ok(b.key.equals(block.key), 'Stored block key correctly')
      t.end()
    })
  })
})

test('block-service: \t get a non existent block', function (t) {
  var b = new Block('Not stored')
  bs.getBlock(b.key, function (err, block) {
    t.ifError(!err)
    t.end()
  })
})

test('block-service: \t store many blocks', function (t) {
  var b1 = new Block('1')
  var b2 = new Block('2')
  var b3 = new Block('3')

  var blocks = []
  blocks.push(b1)
  blocks.push(b2)
  blocks.push(b3)

  bs.addBlocks(blocks, function (err) {
    t.ifError(err, 'stored successfully')
    t.end()
  })
})

test('block-service: \t delete a block', function (t) {
  var b = new Block('Will not live that much')
  bs.addBlock(b, function (err) {
    t.ifError(err)
    bs.deleteBlock(b.key, function (err) {
      t.ifError(err)
      bs.getBlock(b.key, function (err, block) {
        t.ifError(!err)
        t.end()
      })
    })
  })
})

test('block-service: \t delete a non existent block', function (t) {
  var b = new Block('I do not exist')
  bs.deleteBlock(b.key, function (err) {
    t.ifError(err)
    t.end()
  })
})

test('block-service: \t delete many blocks', function (t) {
  var b1 = new Block('1')
  var b2 = new Block('2')
  var b3 = new Block('3')

  var blocks = []
  blocks.push(b1.key)
  blocks.push(b2.key)
  blocks.push(b3.key)

  bs.deleteBlocks(blocks, function (err) {
    t.ifError(err, 'stored successfully')
    t.end()
  })
})
