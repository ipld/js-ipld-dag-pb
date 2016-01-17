var test = require('tape')
var Block = require('../src').Block
var bufeq = require('buffer-equal')

test('block: \t\t test block mutabiltiy', function (t) {
  var block1 = new Block('You can\'t change me, Baby I was born this way!')
  var key = block1.key()
  var data = block1.data()
  key = new Buffer('Definately not the same key')
  data = new Buffer('Definately not the same data')
  t.is(bufeq(key, block1.key()), false)
  t.is(bufeq(data, block1.data()), false)
  t.end()
})
