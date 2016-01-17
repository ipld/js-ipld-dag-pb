var test = require('tape')
var Block = require('../src').Block

test('block: \t\t create a new block', function (t) {
  // make sure it has key and data

  t.end()
})

test('block: \t\t 2 different blocks have different hashes', function (t) {
  t.end()
})

test('block: \t\t block stays immutable', function (t) {
  var block1 = new Block('You can\'t change me, Baby I was born this way!')
  var key = block1.key()
  var data = block1.data()
  key = new Buffer('Definately not the same key')
  data = new Buffer('Definately not the same data')
  t.is(key.equals(block1.key()), false)
  t.is(data.equals(block1.data()), false)
  t.end()
})
