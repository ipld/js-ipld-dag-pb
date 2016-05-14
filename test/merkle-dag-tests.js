/* eslint-env mocha */
'use strict'
const expect = require('chai').expect
const DAGLink = require('../src/dag-node').DAGLink
const DAGNode = require('../src/dag-node').DAGNode
const DAGService = require('../src').DAGService

const BlockService = require('ipfs-block-service')
const Block = require('ipfs-block')
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

    it('create a node with links', () => {
      const l1 = [{
        Name: 'some link',
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
        Size: 8
      }, {
        Name: 'some other link',
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
        Size: 10
      }]
      const d1 = new DAGNode(new Buffer('some data'), l1)

      expect(d1.toJSON()).to.be.eql({
        Data: new Buffer('some data'),
        Links: l1,
        Hash: 'QmRNwg6hP7nVUvhE4XWXsMt3SqDwHeh1kM6QtRybMWNDqN',
        Size: 137
      })

      const l2 = l1.map((l) => {
        return new DAGLink(l.Name, l.Size, l.Hash)
      })
      const d2 = new DAGNode(new Buffer('some data'), l2)
      expect(d1.toJSON()).to.be.eql(d2.toJSON())
      expect(d1.marshal()).to.be.eql(d2.marshal())
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

    it('dagNode.toJSON with empty Node', (done) => {
      const node = new DAGNode(new Buffer(0))
      const nodeJSON = node.toJSON()
      expect(nodeJSON.Data).to.deep.equal(new Buffer(0))
      expect(nodeJSON.Links).to.deep.equal([])
      expect(nodeJSON.Hash).to.exist
      expect(nodeJSON.Size).to.exist
      done()
    })

    it('dagNode.toJSON with data no links', (done) => {
      const node = new DAGNode(new Buffer('La cucaracha'))
      const nodeJSON = node.toJSON()
      expect(nodeJSON.Data).to.deep.equal(new Buffer('La cucaracha'))
      expect(nodeJSON.Links).to.deep.equal([])
      expect(nodeJSON.Hash).to.exist
      expect(nodeJSON.Size).to.exist
      done()
    })

    it('dagNode.toJSON with data and links', (done) => {
      var node1 = new DAGNode(new Buffer('hello'))
      var node2 = new DAGNode(new Buffer('world'))
      node1.addNodeLink('continuation', node2)
      const node1JSON = node1.toJSON()
      expect(node1JSON.Data).to.deep.equal(new Buffer('hello'))
      expect(node1JSON.Links).to.deep.equal([{
        Hash: 'QmPfjpVaf593UQJ9a5ECvdh2x17XuJYG5Yanv5UFnH3jPE',
        Name: 'continuation',
        Size: 7
      }])
      expect(node1JSON.Hash).to.exist
      expect(node1JSON.Size).to.exist
      done()
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

    it('get a mdag node from base58 encoded string', (done) => {
      var encodedMh = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      dagService.get(encodedMh, (err, fetchedNode) => {
        expect(err).to.not.exist
        expect(fetchedNode.data).to.deep.equal(new Buffer(bs58.decode('cL')))
        // just picking the second link and comparing mhash buffer to expected
        expect(fetchedNode.links[1].hash).to.deep.equal(new Buffer(bs58.decode('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')))
        done()
      })
    })

    it('get a mdag node from a multihash buffer', (done) => {
      var mh = new Buffer(bs58.decode('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'))
      dagService.get(mh, (err, fetchedNode) => {
        expect(err).to.not.exist
        expect(fetchedNode.data).to.deep.equal(new Buffer(bs58.decode('cL')))
        expect(fetchedNode.links[1].hash).to.deep.equal(new Buffer(bs58.decode('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')))
        done()
      })
    })

    it('get a mdag node from a /ipfs/ path', (done) => {
      var ipfsPath = '/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      dagService.get(ipfsPath, (err, fetchedNode) => {
        expect(err).to.not.exist
        expect(fetchedNode.data).to.deep.equal(new Buffer(bs58.decode('cL')))
        expect(fetchedNode.links[1].hash).to.deep.equal(new Buffer(bs58.decode('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')))
        done()
      })
    })

    it('supply an improperly formatted string path', (done) => {
      var mh = 'bad path'
      var ipfsPath = '/ipfs/' + mh
      dagService.get(ipfsPath, (err, fetchedNode) => {
        var error = 'Error: Invalid Key'
        expect(err.toString()).to.equal(error)
        done()
      })
    })

    it('supply improperly formatted multihash buffer', (done) => {
      var mh = new Buffer('more data data data')
      dagService.get(mh, (err, fetchedNode) => {
        var error = 'Error: Invalid Key'
        expect(err.toString()).to.equal(error)
        done()
      })
    })

    it('supply something weird', (done) => {
      var mh = 3
      dagService.get(mh, (err, fetchedNode) => {
        var error = 'Error: Invalid Key'
        expect(err.toString()).to.equal(error)
        done()
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
