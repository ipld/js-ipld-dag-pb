/* globals describe, before, it */

'use strict'

var expect = require('chai').expect
var BlockService = require('ipfs-blocks').BlockService
var DAGService = require('../src').DAGService
var DAGNode = require('../src').DAGNode
var IPFSRepo = require('ipfs-repo')

describe('dag-service', () => {
  var repo
  var blockService
  var dagService

  var buf1
  var buf2
  var buf3
  var buf4
  var buf5
  var buf6
  var buf7
  var buf8
  var buf9
  var buf10

  var node1
  var node2
  var node3
  var node4
  var node5
  var node6
  var node7
  var node8
  var node9
  var node10
  var nodes

  var batch

  before(() => {
    repo = new IPFSRepo(process.env.IPFS_PATH)
    blockService = new BlockService(repo)
    dagService = new DAGService(blockService)

    buf1 = new Buffer('node 1')
    buf2 = new Buffer('node 2')
    buf3 = new Buffer('node 3')
    buf4 = new Buffer('node 4')
    buf5 = new Buffer('node 5')
    buf6 = new Buffer('node 6')
    buf7 = new Buffer('node 7')
    buf8 = new Buffer('node 8')
    buf9 = new Buffer('node 9')
    buf10 = new Buffer('node10')

    node1 = new DAGNode()
    node2 = new DAGNode()
    node3 = new DAGNode()
    node4 = new DAGNode()
    node5 = new DAGNode()
    node6 = new DAGNode()
    node7 = new DAGNode()
    node8 = new DAGNode()
    node9 = new DAGNode()
    node10 = new DAGNode()
    nodes = [node2, node3, node4, node5, node6, node7, node8, node9, node10]

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
  })

  it('Add one node to the Service', function (done) {
    var addOne = function (err) {
      expect(err).to.not.exist
      done()
    }

    dagService.add(node1, addOne)
  })

  it('Add nine nodes to the Service', function (done) {
    var i = 0
    var current
    var next = function (err) {
      expect(err).to.not.exist
      i++
      if (i < nodes.length) {
        current = nodes[i]
        dagService.add(current, next)
      } else {
        done()
      }
    }

    if (i < nodes.length) {
      current = nodes[i]
      dagService.add(current, next)
    } else {
      done()
    }
  })

  it.skip('Get one node', function (done) {
    var getOne = function (err, node) {
      expect(err).to.not.exist
      expect(node1.key.equals(node.key)).to.equal(true)
      done()
    }

    dagService.get(node1.key.toString('hex'), getOne)
  })

  it.skip('Get node recursive (get graph)', function (done) {
    var getGraph = function (err, node) {
      expect(err).to.not.exist

      expect(node1.key.equals(node.key)).to.equal(true)
      for (var i = 0; i < node.links.length; i++) {
        var link = node.links[i]
        expect(link.node).to.exist
      }
      done()
    }
    dagService.getRecursive(node1.key.toString('hex'), getGraph)
  })

  it.skip('Remove one node to the Service', function (done) {
    var addRemove = function (err) {
      expect(err).to.not.exist
      done()
    }

    dagService.remove(node1.key.toString('hex'), addRemove)
  })

  it.skip('Remove nine nodes to the Service', function (done) {
    var i = 0
    var current
    var next = function (err) {
      expect(err).to.not.exist
      i++
      if (i < nodes.length) {
        current = nodes[i]
        dagService.remove(current.key.toString('hex'), next)
      } else {
        done()
      }
    }

    if (i < nodes.length) {
      current = nodes[i]
      dagService.remove(current.key.toString('hex'), next)
    } else {
      done()
    }
  })

  it.skip('Add nodes by batch', function (done) {
    var addRemove = function (err) {
      expect(err).to.not.exist
      done()
    }

    dagService.remove(node1.key.toString('hex'), addRemove)
  })

  it.skip('add nodes by batch', function (done) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i]
      batch.add(node, function (err) {
        expect(err).to.not.exist
      })
    }
    batch.commit(function (err) {
      expect(err).to.not.exist
      done()
    })
  })
})
