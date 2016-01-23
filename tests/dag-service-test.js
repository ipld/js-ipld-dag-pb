var BlockService = require('../src/block-service')
var DAGService = require('../src/dag-service').DAGService
var DAGNode = require('../src/dag-node').DAGNode
var test = require('tape')
var IPFSRepo = require('ipfs-repo')

var repo = new IPFSRepo(require('./index.js').repoPath)
var blockService = new BlockService(repo)
var dagService = new DAGService(blockService)

var buf1 = new Buffer('node 1')
var buf2 = new Buffer('node 2')
var buf3 = new Buffer('node 3')
var buf4 = new Buffer('node 4')
var buf5 = new Buffer('node 5')
var buf6 = new Buffer('node 6')
var buf7 = new Buffer('node 7')
var buf8 = new Buffer('node 8')
var buf9 = new Buffer('node 9')
var buf10 = new Buffer('node10')

var node1 = new DAGNode()
var node2 = new DAGNode()
var node3 = new DAGNode()
var node4 = new DAGNode()
var node5 = new DAGNode()
var node6 = new DAGNode()
var node7 = new DAGNode()
var node8 = new DAGNode()
var node9 = new DAGNode()
var node10 = new DAGNode()
var nodes = [node2, node3, node4, node5, node6, node7, node8, node9, node10]

node1.data = buf1
node2.data = buf2
node3.data = buf3
node4.data = buf4
node5.data = buf5
node6.data = buf6
node7.data = buf7
node8.data = buf8
node9.data = buf9
node10.data = buf10

node9.addNodeLink('10', node10)
node6.addNodeLink('9', node9)
node6.addNodeLink('8', node8)
node6.addNodeLink('7', node7)
node3.addNodeLink('4', node4)
node3.addNodeLink('5', node5)
node3.addNodeLink('6', node6)
node1.addNodeLink('2', node2)
node1.addNodeLink('3', node3)

var batch= dagService.batch()

test('dag-service: \t\t Add one node to the Service', function(t){
  var addOne = function (err) {
    t.is(!err, true, 'Add one node without error')
    t.end()
  }

  dagService.add(node1, addOne)

})

test('dag-service: \t\t Add nine nodes to the Service', function(t){
  var i = 0
  var current
  var next = function (err) {
    t.is(!err, true, 'Add ' + (i + 1) + ' nodes without error')
    i++
    if (i < nodes.length) {
      current = nodes[i]
      dagService.add(current, next)
    } else {
      t.is(!err, true, 'Added nine nodes without error')
      t.end()
    }
  }

  if (i < nodes.length) {
    current = nodes[i]
    dagService.add(current, next)
  } else {
    t.end()
  }

})

test('dag-service: \t\t Get one node', function(t){
  var getOne= function(err, node){
    t.is(!err, true, 'Got one node without error')
    t.is(node1.key().equals(node.key()), true, 'Got the right node?')
    t.end()
  }

  dagService.get(node1.key().toString('hex'), getOne)

})

test('dag-service: \t\t Get node recursive (get graph)', function(t){
  var getGraph= function(err, node){
    t.is(!err, true, 'Got node without error')
    t.is(node1.key().equals(node.key()), true, 'Got the right node?')
    for(var i = 0; i < node.links.length; i++){
      var link = node.links[i]
      t.is(!!link.node, true, "graph has link nodes")
    }
    t.end()
  }
  dagService.getRecursive(node1.key().toString('hex'), getGraph)

})

test('dag-service: \t\t Remove one node to the Service', function(t){
  var addRemove = function (err) {
    t.is(!err, true, 'Remove one node without error')
    t.end()
  }

  dagService.remove(node1.key().toString('hex'), addRemove)

})

test('dag-service: \t\t Remove nine nodes to the Service', function(t){
  var i = 0
  var current
  var next = function (err) {
    t.is(!err, true, 'Removed ' + (i + 1) + ' nodes without error')
    i++
    if (i < nodes.length) {
      current = nodes[i]
      dagService.remove(current.key().toString('hex'), next)
    } else {
      t.is(!err, true, 'Added nine nodes without error')
      t.end()
    }
  }

  if (i < nodes.length) {
    current = nodes[i]
    dagService.remove(current.key().toString('hex'), next)
  } else {
    t.end()
  }

})


test('dag-service: \t\t Add nodes by batch', function(t){
  var addRemove = function (err) {
    t.is(!err, true, 'Remove one node without error')
    t.end()
  }

  dagService.remove(node1.key().toString('hex'), addRemove)

})


test('dag-service: \t\t Add nodes by batch', function(t){
  for(var i = 0; i < nodes.length; i++){
    var node= nodes[i]
    batch.add(node, function(err){
      t.is(!err, true, 'Added' + (i+1) + ' node to batch without error')
    })
  }
  batch.commit(function(err){
    t.is(!err, true, 'batch committed successfully')

    t.end()
  })
})