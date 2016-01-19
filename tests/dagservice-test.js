var BlockService = require('../blockservice')
var test = require('tape')
var Block = require('../block')
var fs = require('fs-blob-store')
var util = require('../util')
var DAGService= require('../merkledag')
var Node = require('../node').Node


test('Test blockservice', function (t) {
  var datastore= new fs("blocks");
  var blockService= new BlockService(datastore);
  var dagService= new DAGService(blockService);

  var buf1= new Buffer("node 1")
  var buf2= new Buffer("node 2")
  var buf3= new Buffer("node 3")
  var buf4= new Buffer("node 4")
  var buf5= new Buffer("node 5")
  var buf6= new Buffer("node 6")
  var buf7= new Buffer("node 7")
  var buf8= new Buffer("node 8")
  var buf9= new Buffer("node 9")
  var buf10= new Buffer("node10")

  var node1= new Node()
  var node2= new Node()
  var node3= new Node()
  var node4= new Node()
  var node5= new Node()
  var node6= new Node()
  var node7= new Node()
  var node8= new Node()
  var node9= new Node()
  var node10= new Node()

  node1.data(buf1)
  node2.data(buf2)
  node3.data(buf3)
  node4.data(buf4)
  node5.data(buf5)
  node6.data(buf6)
  node7.data(buf7)
  node8.data(buf8)
  node9.data(buf9)
  node10.data(buf10)

  node1.addNodeLink("2",node2)
  node1.addNodeLink("3", node3)
  node3.addNodeLink("4", node3)
  node3.addNodeLink("5", node5)
  node3.addNodeLink("6", node6)
  node6.addNodeLink("7", node7)
  node6.addNodeLink("8", node9)
  node9.addNodeLink("9", node10)

  console.log("node 1" + node1.key().toString('hex'))
  var addOne= function(err){
    t.is(!err, true, 'Add one node without error')
    dagService.addRecursive(node1,addTenRecursive)
  }
  var addTenRecursive= function(err){
    t.is(!err, true, 'Add ten nodes without error')
  }
  dagService.add(node10, addOne)
  t.end()
});