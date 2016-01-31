/* globals describe, it */

'use strict'

const expect = require('chai').expect
const DAGLink = require('../src/dag-node').DAGLink
const DAGNode = require('../src/dag-node').DAGNode

const BlockService = require('ipfs-blocks').BlockService
const Block = require('ipfs-blocks').Block
const bs58 = require('bs58')

const IPFSRepo = require('ipfs-repo')

describe('dag-node', () => {
  it('create a node', (done) => {
    var dagN = new DAGNode(new Buffer('some data'))
    expect(dagN.data.length > 0).to.equal(true)
    expect(Buffer.isBuffer(dagN.data)).to.equal(true)
    expect(dagN.size() > 0).to.equal(true)
    expect(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data)).to.equal(true)
    done()
  })

  it('create an emtpy node', (done) => {
    var dagN = new DAGNode(new Buffer(0))
    expect(dagN.data.length).to.equal(0)
    expect(Buffer.isBuffer(dagN.data)).to.equal(true)
    expect(dagN.size()).to.equal(0)
    expect(dagN.data.equals(dagN.unMarshal(dagN.marshal()).data)).to.equal(true)
    done()
  })

  it('create a link', (done) => {
    var buf = new Buffer('multihash of file.txt')
    var link = new DAGLink('file.txt', 10, buf)
    expect(link.name).to.equal('file.txt')
    expect(link.size).to.equal(10)
    expect(link.hash.equals(buf)).to.equal(true)
    done()
  })

  it('add a link to a node', (done) => {
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

  it('add several links to a node', (done) => {
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

  it('marshal a node and store it with block-service', (done) => {
    var repo = new IPFSRepo(process.env.IPFS_PATH)
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
    var repo = new IPFSRepo(process.env.IPFS_PATH)
    var bs = new BlockService(repo)

    var mh = new Buffer(bs58.decode('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'))

    bs.getBlock(mh.toString('hex'), (err, block) => {
      expect(err).to.not.exist
      var retrievedDagNode = new DAGNode()
      retrievedDagNode.unMarshal(block.data)
      expect(retrievedDagNode.data).to.exist
      expect(retrievedDagNode.links.length).to.equal(6)
      done()
    })
  })
})
