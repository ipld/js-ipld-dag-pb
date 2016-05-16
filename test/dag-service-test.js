/* eslint-env mocha */
'use strict'
const expect = require('chai').expect
const DAGNode = require('../src').DAGNode
const DAGService = require('../src').DAGService

const BlockService = require('ipfs-block-service')
const bs58 = require('bs58')
const series = require('run-series')

module.exports = function (repo) {
  describe('DAGService', function () {
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
      const mh = new Buffer(bs58.decode('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'))
      dagService.get(mh, (err, fetchedNode) => {
        expect(err).to.not.exist
        expect(fetchedNode.data).to.deep.equal(new Buffer(bs58.decode('cL')))
        expect(fetchedNode.links[1].hash).to.deep.equal(new Buffer(bs58.decode('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')))
        done()
      })
    })

    it('get a mdag node from a /ipfs/ path', (done) => {
      const ipfsPath = '/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      dagService.get(ipfsPath, (err, fetchedNode) => {
        expect(err).to.not.exist
        expect(fetchedNode.data).to.deep.equal(new Buffer(bs58.decode('cL')))
        expect(fetchedNode.links[1].hash).to.deep.equal(new Buffer(bs58.decode('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')))
        done()
      })
    })

    it('supply an improperly formatted string path', (done) => {
      const mh = 'bad path'
      const ipfsPath = '/ipfs/' + mh
      dagService.get(ipfsPath, (err, fetchedNode) => {
        const error = 'Error: Invalid Key'
        expect(err.toString()).to.equal(error)
        done()
      })
    })

    it('supply improperly formatted multihash buffer', (done) => {
      const mh = new Buffer('more data data data')
      dagService.get(mh, (err, fetchedNode) => {
        const error = 'Error: Invalid Key'
        expect(err.toString()).to.equal(error)
        done()
      })
    })

    it('supply something weird', (done) => {
      const mh = 3
      dagService.get(mh, (err, fetchedNode) => {
        const error = 'Error: Invalid Key'
        expect(err.toString()).to.equal(error)
        done()
      })
    })

    it('get a dag recursively', (done) => {
      // 1 -> 2 -> 3
      const node1 = new DAGNode(new Buffer('1'))
      const node2 = new DAGNode(new Buffer('2'))
      const node3 = new DAGNode(new Buffer('3'))

      series([
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

      series([
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
