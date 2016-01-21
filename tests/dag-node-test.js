var test = require('tape')
var DAGLink = require('../src/dag-node').DAGLink
var DAGNode = require('../src/dag-node').DAGNode

test('dag-node: \t\t create a node', function (t) {
  var dagN = new DAGNode(new Buffer('some data'))
  t.ok(dagN.data.length > 0, 'node has data')
  t.ok(Buffer.isBuffer(dagN.data), 'data type of node is zero')
  t.ok(dagN.size() > 0, 'node size is bigger than zero')
  t.equal(dagN.data, dagN.unMarshal(dagN.marshal()).data, 'marshal and unmarshal is ok')
  t.end()
})

test('dag-node: \t\t create a link', function (t) {

  t.end()
})

test('dag-node: \t\t add a link to a node', function (t) {
  t.end()
})

test('dag-node: \t\t add several links to a node', function (t) {
  t.end()
})

test('dag-node: \t\t marshal a node and store it with block-service', function (t) {
  t.end()
})

test('dag-node: \t\t read a go-ipfs marshalled node and assert it gets read correctly', function (t) {
  t.end()
})

// -------

test('dag-node: \t\t Link Creation and Assignment', function (t) {
  var buf = new Buffer('OMGWTFTHISISWRONG')
  var link = new DAGLink('Joss Whedon', 20, buf)
  t.is(link.name, 'Joss Whedon', 'Check name assignment')
  t.is(link.size, 20, 'Check size assignment')
  t.is(link.hash.equals(buf), true, 'Check hash assignment')
  t.end()
})

test('dag-node: \t\t Node Creation and Assignment', function (t) {
  var buf = new Buffer('Buffy the Vampire Slayer')
  var node = new DAGNode()
  node.data = buf
  t.is(node.data.length > 0, true, 'Check buffer to data assignment')
  t.is(Buffer.isBuffer(node.data), true, 'Check get method of data buffer')
  t.is(node.size() > 0, true, 'Check size of link')
  var premarshal = node.data
  var postunmarshal = node.unMarshal(node.encoded()).data
  t.is(premarshal.equals(postunmarshal), true, 'Check both marshalled and unmarshalled protobuf return the same data')
  t.end()
})

test('dag-node: \t\t Node Linking', function (t) {
  var buf1 = new Buffer('Buffy the Vampire Slayer')
  var buf2 = new Buffer('Serenity')
  var node1 = new DAGNode()
  var node2 = new DAGNode()

  node1.data = buf1
  node2.data = buf2

  var sizen1 = node1.size()
  var mh1 = node1.multiHash()

  node1.addNodeLink('next', node2)
  t.is(node1.links.length > 0, true, 'Check node links successfully added')
  t.is(node1.size() > sizen1, true, "Check node's size increased with new link addition")
  t.is(node1.multiHash().equals(mh1), false, 'Check hash differs after addition of new link')

  node1.removeNodeLink('names')
  t.is(node1.multiHash().equals(mh1), true, 'Check hash is the same after removal of its child')
  t.end()
})
