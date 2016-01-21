var test = require('tape')
var Block = require('../src').Block

test('block: \t\t create a new block', function (t) {
  var b = new Block('random-data')
  t.ok(b.key, 'block has key')
  t.ok(b.data, 'block has data')
  t.end()
})

test('block: \t\t fail to create an empty block', function (t) {
  var b
  try {
    b = new Block()
  } catch (err) {
    t.is(b, undefined, 'block was not created')
    t.end()
  }
})

test('block: \t\t 2 different blocks have different hashes', function (t) {
  var b1 = new Block('random-data')
  var b2 = new Block('more-random-data')
  t.notDeepEqual(b1, b2)
  t.end()
})

test.skip('block: \t\t block stays immutable', function (t) {
  // Test from the original implementation
  // It doesn't stricly verify the immutability of the Block object
  var block = new Block("Can't change this!")
  var key = block.key
  key = new Buffer('new key')

  t.is(key.equals(block.key), false)
  t.end()
})
