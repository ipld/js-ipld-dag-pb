/* eslint-env mocha */
'use strict'
const expect = require('chai').expect
const DAGLink = require('../src/dag-node').DAGLink
const DAGNode = require('../src/dag-node').DAGNode
const DAGService = require('../src').DAGService

const BlockService = require('ipfs-blocks').BlockService
const Block = require('ipfs-blocks').Block
const bs58 = require('bs58')
const async = require('async')

module.exports = function (repo) {
  describe('dag-node', function () {
    it('create a node', function (done) {
      var dagN = new DAGNode(new Buffer('some data'))
      expect(dagN.data.length > 0).to.equal(true)
      expect(Buffer.isBuffer(dagN.data)).to.equal(true)
      expect(dagN.size() > 0).to.equal(true)
      expect(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data)).to.equal(true)
      done()
    })

    it('create an emtpy node', function (done) {
      var dagN = new DAGNode(new Buffer(0))
      expect(dagN.data.length).to.equal(0)
      expect(Buffer.isBuffer(dagN.data)).to.equal(true)
      expect(dagN.size()).to.equal(0)
      expect(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data)).to.equal(true)
      done()
    })

    it('create a link', function (done) {
      var buf = new Buffer('multihash of file.txt')
      var link = new DAGLink('file.txt', 10, buf)
      expect(link.name).to.equal('file.txt')
      expect(link.size).to.equal(10)
      expect(link.hash.equals(buf)).to.equal(true)
      done()
    })

    it('add a link to a node', function (done) {
      var dagNode1 = new DAGNode(new Buffer('4444'))
      var dagNode2 = new DAGNode(new Buffer('22'))

      var dagNode1Size = dagNode1.size()
      var dagNode1Multihash = dagNode1.multihash()

      dagNode1.addNodeLink('next', dagNode2)
      expect(dagNode1.links.length > 0).to.equal(true)
      expect(dagNode1.size() > dagNode1Size).to.equal(true)

      expect(dagNode1.multihash().equals(dagNode1Multihash)).to.equal(false)
      expect(dagNode1.links[0].hash.equals(dagNode2.multihash())).to.equal(true)

      dagNode1.removeNodeLink('next')
      expect(dagNode1.links.length).to.equal(0)
      expect(dagNode1.multihash().equals(dagNode1Multihash)).to.equal(true)
      done()
    })

    it('add several links to a node', function (done) {
      var dagNode1 = new DAGNode(new Buffer('4444'))
      var dagNode2 = new DAGNode(new Buffer('22'))
      var dagNode3 = new DAGNode(new Buffer('333'))

      var dagNode1Size = dagNode1.size()
      var dagNode1Multihash = dagNode1.multihash()

      dagNode1.addNodeLink('next', dagNode2)
      expect(dagNode1.links.length > 0).to.equal(true)
      expect(dagNode1.size() > dagNode1Size).to.equal(true)

      dagNode1.addNodeLink('next', dagNode3)
      expect(dagNode1.links.length > 1).to.equal(true)
      expect(dagNode1.size() > dagNode1Size).to.equal(true)

      expect(dagNode1.multihash().equals(dagNode1Multihash)).to.equal(false)

      dagNode1.removeNodeLink('next')

      expect(dagNode1.multihash().equals(dagNode1Multihash)).to.equal(true)
      done()
    })

    it('remove link to a node by hash', function (done) {
      var dagNode1 = new DAGNode(new Buffer('4444'))
      var dagNode2 = new DAGNode(new Buffer('22'))

      var dagNode1Size = dagNode1.size()
      var dagNode1Multihash = dagNode1.multihash()

      dagNode1.addNodeLink('next', dagNode2)
      expect(dagNode1.links.length > 0).to.equal(true)
      expect(dagNode1.size() > dagNode1Size).to.equal(true)

      expect(dagNode1.multihash().equals(dagNode1Multihash)).to.equal(false)
      expect(dagNode1.links[0].hash.equals(dagNode2.multihash())).to.equal(true)
      dagNode1.removeNodeLinkByHash(dagNode2.multihash())
      expect(dagNode1.links.length).to.equal(0)
      expect(dagNode1.multihash().equals(dagNode1Multihash)).to.equal(true)
      done()
    })

    it('marshal a node and store it with block-service', function (done) {
      var bs = new BlockService(repo)

      var dagN = new DAGNode(new Buffer('some data'))
      expect(dagN.data.length > 0).to.equal(true)
      expect(Buffer.isBuffer(dagN.data)).to.equal(true)
      expect(dagN.size() > 0).to.equal(true)
      expect(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data)).to.equal(true)

      var b = new Block(dagN.marshal())

      bs.addBlock(b, (err) => {
        expect(err).to.not.exist
        bs.getBlock(b.key, (err, block) => {
          expect(err).to.not.exist
          expect(b.data.equals(block.data)).to.equal(true)
          expect(b.key.equals(block.key)).to.equal(true)
          var fetchedDagNode = new DAGNode()
          fetchedDagNode.unMarshal(block.data)
          expect(dagN.data.equals(fetchedDagNode.data)).to.equal(true)
          done()
        })
      })
    })

    it('read a go-ipfs marshalled node and assert it gets read correctly', function (done) {
      var bs = new BlockService(repo)

      var mh = new Buffer(bs58.decode('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'))
      bs.getBlock(mh, function (err, block) {
        expect(err).to.not.exist
        var retrievedDagNode = new DAGNode()
        retrievedDagNode.unMarshal(block.data)
        expect(retrievedDagNode.data).to.exist
        expect(retrievedDagNode.links.length).to.equal(6)
        done()
      })
    })
  })

  describe('dag-service', function () {
    const bs = new BlockService(repo)
    const dagService = new DAGService(bs)

    it('add a mdag node', (done) => {
      const node = new DAGNode(new Buffer('data data data'))
      dagService.add(node, (err) => {
        expect(err).to.not.exist
        done()
      })
    })

    it('get a mdag node', (done) => {
      const node = new DAGNode(new Buffer('more data data data'))
      dagService.add(node, (err) => {
        expect(err).to.not.exist
        var mh = node.multihash()
        dagService.get(mh, (err, fetchedNode) => {
          expect(err).to.not.exist
          expect(node.data).to.deep.equal(fetchedNode.data)
          expect(node.links).to.deep.equal(fetchedNode.links)
          done()
        })
      })
    })

    it('get a dag recursively', (done) => {
      // 1 -> 2 -> 3
      const node1 = new DAGNode(new Buffer('1'))
      const node2 = new DAGNode(new Buffer('2'))
      const node3 = new DAGNode(new Buffer('3'))

      async.series([
        (cb) => { node2.addNodeLink('', node3); cb() },
        (cb) => { node1.addNodeLink('', node2); cb() },
        (cb) => { dagService.add(node1, cb) },
        (cb) => { dagService.add(node2, cb) },
        (cb) => { dagService.add(node3, cb) },
        (cb) => {
          dagService.getRecursive(node1.multihash(), (err, nodes) => {
            expect(err).to.not.exist
            expect(nodes.length).to.equal(3)
            cb()
          })
        }
      ], (err) => {
        expect(err).to.not.exist
        done()
      })
    })

    it('remove', (done) => {
      const node = new DAGNode(new Buffer('not going to live enough'))
      dagService.add(node, (err) => {
        expect(err).to.not.exist
        const mh = node.multihash()
        dagService.get(mh, (err, fetchedNode) => {
          expect(err).to.not.exist
          dagService.remove(mh, (err) => {
            expect(err).to.not.exist
            dagService.get(mh, (err) => {
              expect(err).to.exist
              done()
            })
          })
        })
      })
    })

    // tests to see if we are doing the encoding well
    it('cycle test', (done) => {
      const dftHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      const mh = new Buffer(bs58.decode(dftHash))
      dagService.get(mh, (err, node) => {
        expect(err).to.not.exist
        expect(mh.equals(node.multihash())).to.equal(true)
        const n = new DAGNode(node.data, node.links)
        const cn = n.copy()
        expect(mh.equals(cn.multihash())).to.equal(true)
        dagService.add(cn, (err) => {
          expect(err).to.not.exist
          dagService.get(cn.multihash(), (err, nodeB) => {
            expect(err).to.not.exist
            expect(nodeB.data.equals(node.data)).to.equal(true)
            expect(nodeB.links.length).to.equal(node.links.length)
            expect(nodeB.data.equals(new Buffer('\u0008\u0001'))).to.equal(true)
            done()
          })
        })
      })
    })

    it('get a broken dag recursively', (done) => {
      // 1 -> 2 -> 3
      const node1 = new DAGNode(new Buffer('a'))
      const node2 = new DAGNode(new Buffer('b'))
      const node3 = new DAGNode(new Buffer('c'))

      async.series([
        (cb) => { node2.addNodeLink('', node3); cb() },
        (cb) => { node1.addNodeLink('', node2); cb() },
        (cb) => { dagService.add(node1, cb) },
        // on purpose, do not add node2 (cb) => { dagService.add(node2, cb) },
        (cb) => { dagService.add(node3, cb) },
        (cb) => {
          dagService.getRecursive(node1.multihash(), (err, nodes) => {
            expect(err).to.exist
            expect(nodes.length).to.equal(1)
            cb()
          })
        }
      ], (err) => {
        expect(err).to.not.exist
        done()
      })
    })
  })
}
