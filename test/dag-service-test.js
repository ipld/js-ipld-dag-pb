/* eslint-env mocha */
'use strict'
const expect = require('chai').expect
const DAGNode = require('../src').DAGNode
const DAGService = require('../src').DAGService

const BlockService = require('ipfs-block-service')
const bs58 = require('bs58')
const series = require('run-series')
const pull = require('pull-stream')
const mh = require('multihashes')

module.exports = function (repo) {
  describe('DAGService', function () {
    const bs = new BlockService(repo)
    const dagService = new DAGService(bs)

    it('add a mdag node', (done) => {
      const node = new DAGNode(new Buffer('data data data'))

      pull(
        pull.values([node]),
        dagService.putStream(done)
      )
    })

    it('get a mdag node from base58 encoded string', (done) => {
      var encodedMh = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

      pull(
        dagService.getStream(encodedMh),
        pull.collect((err, res) => {
          expect(err).to.not.exist
          expect(
            res[0].data
          ).to.deep.equal(
            new Buffer(bs58.decode('cL'))
          )
          // just picking the second link and comparing mhash
          // buffer to expected
          expect(
            res[0].links[1].hash
          ).to.be.eql(
            mh.fromB58String('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')
          )
          done()
        })
      )
    })

    it('get a mdag node from a multihash buffer', (done) => {
      const hash = mh.fromB58String('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')

      pull(
        dagService.getStream(hash),
        pull.collect((err, res) => {
          expect(err).to.not.exist
          expect(
            res[0].data
          ).to.be.eql(
            new Buffer(bs58.decode('cL'))
          )
          expect(
            res[0].links[1].hash
          ).to.be.eql(
            mh.fromB58String('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')
          )
          done()
        })
      )
    })

    it('get a mdag node from a /ipfs/ path', (done) => {
      const ipfsPath = '/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

      pull(
        dagService.getStream(ipfsPath),
        pull.collect((err, res) => {
          expect(err).to.not.exist
          expect(
            res[0].data
          ).to.be.eql(
            new Buffer(bs58.decode('cL'))
          )
          expect(
            res[0].links[1].hash
          ).to.be.eql(
            mh.fromB58String('QmYCvbfNbCwFR45HiNP45rwJgvatpiW38D961L5qAhUM5Y')
          )
          done()
        })
      )
    })

    it('supply an improperly formatted string path', (done) => {
      pull(
        dagService.getStream('/ipfs/bad path'),
        pull.onEnd((err) => {
          expect(err.toString()).to.be.eql('Error: Invalid Key')
          done()
        })
      )
    })

    it('supply improperly formatted multihash buffer', (done) => {
      pull(
        dagService.getStream(new Buffer('bad path')),
        pull.onEnd((err) => {
          expect(err.toString()).to.be.eql('Error: Invalid Key')
          done()
        })
      )
    })

    it('supply something weird', (done) => {
      pull(
        dagService.getStream(3),
        pull.onEnd((err) => {
          expect(err.toString()).to.be.eql('Error: Invalid Key')
          done()
        })
      )
    })

    it('get a dag recursively', (done) => {
      // 1 -> 2 -> 3
      const node1 = new DAGNode(new Buffer('1'))
      const node2 = new DAGNode(new Buffer('2'))
      const node3 = new DAGNode(new Buffer('3'))

      node2.addNodeLink('', node3)
      node1.addNodeLink('', node2)

      pull(
        pull.values([node1, node2, node3]),
        dagService.putStream((err) => {
          if (err) return done(err)

          dagService.getRecursive(node1.multihash(), (err, nodes) => {
            if (err) return done(err)
            expect(nodes.length).to.equal(3)
            done()
          })
        })
      )
    })

    it('get a dag recursively (stream)', (done) => {
      // 1 -> 2 -> 3
      const node1 = new DAGNode(new Buffer('1'))
      const node2 = new DAGNode(new Buffer('2'))
      const node3 = new DAGNode(new Buffer('3'))

      node2.addNodeLink('', node3)
      node1.addNodeLink('', node2)

      pull(
        pull.values([node1, node2, node3]),
        dagService.putStream((err) => {
          if (err) return done(err)
          pull(
            dagService.getRecursiveStream(node1.multihash()),
            pull.collect((err, nodes) => {
              if (err) return done(err)
              expect(nodes.length).to.equal(3)
              done()
            })
          )
        })
      )
    })

    it('remove', (done) => {
      const node = new DAGNode(new Buffer('not going to live enough'))

      series([
        (cb) => dagService.put(node, cb),
        (cb) => dagService.get(node.multihash(), cb),
        (cb) => dagService.remove(node.multihash(), cb),
        (cb) => dagService.get(node.multihash(), (err) => {
          expect(err).to.exist
          cb()
        })
      ], done)
    })

    // tests to see if we are doing the encoding well
    it('cycle test', (done) => {
      const dftHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      const hash = mh.fromB58String(dftHash)

      dagService.get(hash, (err, node) => {
        expect(err).to.not.exist
        expect(hash.equals(node.multihash())).to.equal(true)
        const n = new DAGNode(node.data, node.links)
        const cn = n.copy()
        expect(hash.equals(cn.multihash())).to.equal(true)
        dagService.put(cn, (err) => {
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

      node2.addNodeLink('', node3)
      node1.addNodeLink('', node2)

      series([
        (cb) => dagService.put(node1, cb),
        // on purpose, do not add node2
        // (cb) => dagService.put(node2, cb),
        (cb) => dagService.put(node3, cb),
        (cb) => pull(
          dagService.getRecursiveStream(node1.multihash()),
          pull.collect((err, nodes) => {
            if (err) return cb(err)
            expect(nodes.length).to.equal(1)
            cb()
          })
        )
      ], done)
    })

    it('get a node with unnamed links', (done) => {
      var b58MH = 'QmRR6dokkN7dZzNZUuqqvUGWbuwvXkavWC6dJY3nT17Joc'
      dagService.get(b58MH, (err, node) => {
        expect(err).to.not.exist
        expect(node.toJSON().Links).to.deep.equal([
          {
            Name: '',
            Size: 45623854,
            Hash: 'QmREcKL7eXVme1ZmedsBYwLUnYmqYt3QyeJfthnp1SGo3z'
          },
          {
            Name: '',
            Size: 41485691,
            Hash: 'QmWEpWQA5mJL6KzRzGqL6RCsFhLCWmovx6wHji7BzA8qmi'
          }
        ])
        done()
      })
    })
  })
}
