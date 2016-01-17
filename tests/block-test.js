var test = require('tape')
var Block = require('../src/block')
var bufeq = require('buffer-equal')

test('Test block mutabiltiy', function (t) {
  var block1 = new Block("You can't change me, Baby I was born this way!") // proof you can program and be completely retarded
  var key = block1.key()
  var data = block1.data()
  key = new Buffer('Definately not the same key')
  data = new Buffer('Definately not the same data')
  t.is(bufeq(key, block1.key()), false)
  t.is(bufeq(data, block1.data()), false)
  t.end()
})
