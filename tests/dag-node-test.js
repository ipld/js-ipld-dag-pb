var test = require('tape')
var DAGLink = require('../src/dag-node').DAGLink
var DAGNode = require('../src/dag-node').DAGNode

var BlockService = require('../src').BlockService
var Block = require('../src').Block

var IPFSRepo = require('ipfs-repo')

test('dag-node: \t\t create a node', function (t) {
  var dagN = new DAGNode(new Buffer('some data'))
  t.ok(dagN.data.length > 0, 'node has data')
  t.ok(Buffer.isBuffer(dagN.data), 'data type of node is zero')
  t.ok(dagN.size() > 0, 'node size is bigger than zero')
  t.ok(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data), 'marshal and unmarshal is ok')
  t.end()
})

test('dag-node: \t\t create a link', function (t) {
  var buf = new Buffer('multihash of file.txt')
  var link = new DAGLink('file.txt', 10, buf)
  t.equal(link.name, 'file.txt', 'has name')
  t.equal(link.size, 10, 'has size')
  t.is(link.hash.equals(buf), true, 'has buf')
  t.end()
})

test('dag-node: \t\t add a link to a node', function (t) {
  var dagNode1 = new DAGNode(new Buffer('4444'))
  var dagNode2 = new DAGNode(new Buffer('22'))

  var dagNode1Size = dagNode1.size()
  var dagNode1Multihash = dagNode1.multiHash()

  dagNode1.addNodeLink('next', dagNode2)
  t.is(dagNode1.links.length > 0, true, 'link added successfuly')
  t.is(dagNode1.size() > dagNode1Size, true, 'dagNode size increased')

  t.is(dagNode1.multiHash().equals(dagNode1Multihash), false, 'hash must have changed')

  dagNode1.removeNodeLink('next')
  t.equal(dagNode1.links.length, 0, 'links should be 0')

  t.is(dagNode1.multiHash().equals(dagNode1Multihash), true, 'hash must have returned to the original')
  t.end()
})

test('dag-node: \t\t add several links to a node', function (t) {
  var dagNode1 = new DAGNode(new Buffer('4444'))
  var dagNode2 = new DAGNode(new Buffer('22'))
  var dagNode3 = new DAGNode(new Buffer('333'))

  var dagNode1Size = dagNode1.size()
  var dagNode1Multihash = dagNode1.multiHash()

  dagNode1.addNodeLink('next', dagNode2)
  t.is(dagNode1.links.length > 0, true, 'link added successfuly')
  t.is(dagNode1.size() > dagNode1Size, true, 'dagNode size increased')

  dagNode1.addNodeLink('next', dagNode3)
  t.is(dagNode1.links.length > 1, true, 'link added successfuly')
  t.is(dagNode1.size() > dagNode1Size, true, 'dagNode size increased')

  t.is(dagNode1.multiHash().equals(dagNode1Multihash), false, 'hash must have changed')

  dagNode1.removeNodeLink('next')

  t.is(dagNode1.multiHash().equals(dagNode1Multihash), true, 'hash must have returned to the original')
  t.end()
})

test('dag-node: \t\t marshal a node and store it with block-service', function (t) {
  var repo = new IPFSRepo(require('./index.js').repoPath)
  var bs = new BlockService(repo)

  var dagN = new DAGNode(new Buffer('some data'))
  t.ok(dagN.data.length > 0, 'node has data')
  t.ok(Buffer.isBuffer(dagN.data), 'data type of node is zero')
  t.ok(dagN.size() > 0, 'node size is bigger than zero')
  t.ok(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data), 'marshal and unmarshal is ok')

  var b = new Block(dagN.marshal())

  bs.addBlock(b, function (err) {
    t.ifError(err)
    bs.getBlock(b.key, function (err, block) {
      t.ifError(err)
      t.ok(b.data.equals(block.data), 'Stored block data correctly')
      t.ok(b.key.equals(block.key), 'Stored block key correctly')
      var fetchedDagNode = new DAGNode()
      fetchedDagNode.unMarshal(b.data)
      t.ok(dagN.data.equals(fetchedDagNode.data), 'marsheled, stored, retried and unmarsheld correctly')
      t.end()
    })
  })
})

test('dag-node: \t\t read a go-ipfs marshalled node and assert it gets read correctly', function (t) {
  t.end()
})
