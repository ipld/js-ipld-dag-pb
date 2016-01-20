var BlockService = require('../src/block-service')
var DAGService= require('../src/dag-service')
var Node = require('../src/dag-node').Node
var test = require('tape')
var fs = require('fs-blob-store')
var IPFSRepo = require('ipfs-repo')


test('Test DAGService', function (t) {
  var datastore= new fs("blocks");
  var repo = new IPFSRepo(require('./index.js').repoPath)
  blockService= new BlockService(repo)
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
  var nodes =[node2, node3, node4, node5, node6, node7, node8, node9, node10]
  node1.data= buf1
  node2.data= buf2
  node3.data= buf3
  node4.data= buf4
  node5.data= buf5
  node6.data= buf6
  node7.data= buf7
  node8.data= buf8
  node9.data= buf9
  node10.data= buf10

  node1.addNodeLink("2",node2)
  node1.addNodeLink("3", node3)
  node3.addNodeLink("4", node3)
  node3.addNodeLink("5", node5)
  node3.addNodeLink("6", node6)
  node6.addNodeLink("7", node7)
  node6.addNodeLink("8", node9)
  node9.addNodeLink("9", node10)

  var addOne= function(err){
    t.is(!err, true, 'Add one node without error')
    var i =0
    var current
    var next= function(err){
      t.is(!err, true, 'Add ' + (i+1) + ' nodes without error')
      i++
      if(i < nodes.length){
        current= nodes[i]
        dagService.add(current, next)
      }else{
        addNine(err)
      }

    }
    if(i < nodes.length){
      current= nodes[i]
      dagService.add(current, next)
    }else{
      //t.end()
      //dagService.addRecursive(node1,addNineRecursive)
    }

  }
  var addNine= function(err){
    t.is(!err, true, 'Added all nine nodes without error')

    dagService.get(node1.key().toString('hex'),getOne)
  }
  var getOne=function(err, node){
    t.is(!err, true, 'Got one node without error')
    t.is(node.data.equals(node1.data), true,"Got exactly the expected node")
    dagService.getRecursive(node1.key().toString('hex'),getRecursive)
  }
  var getRecursive= function(err,node){
    t.is(!err, true, 'Got a node and its children without error')
    console.log(node)
    t.is(node.data.equals(node1.data), true,"Got exactly the expected node")
    for(var i= 0; i < node.links.length; i++){
      var link = node.links[i]
      t.is(!!link.node, true, 'Got its children without error')
    }
    t.end()
  }
  dagService.add(node1, addOne)

});