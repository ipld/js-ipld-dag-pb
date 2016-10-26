/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const checkmark = require('chai-checkmark')
chai.use(checkmark)

const dagPB = require('../src')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const util = dagPB.util
const parallel = require('async/parallel')
const series = require('async/series')

const BlockService = require('ipfs-block-service')
const Block = require('ipfs-block')
const CID = require('cids')
const bs58 = require('bs58')

module.exports = (repo) => {
  describe('DAGNode', () => {
    it('create a node', (done) => {
      expect(7).checks(done)

      const node = new DAGNode(new Buffer('some data'))

      expect(node.data.length).to.be.above(0).mark()
      expect(Buffer.isBuffer(node.data)).to.be.true.mark()

      node.size((err, size) => {
        expect(err).to.not.exist.mark()
        expect(size).to.be.above(0).mark()
      })

      util.serialize(node, (err, serialized) => {
        expect(err).to.not.exist.mark()

        util.deserialize(serialized, (err, deserialized) => {
          expect(err).to.not.exist.mark()
          expect(node.data).to.eql(deserialized.data).mark()
        })
      })
    })

    it('create a node with links', (done) => {
      const l1 = [{
        Name: 'some link',
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
        Size: 8
      }, {
        Name: 'some other link',
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
        Size: 10
      }]

      const node1 = new DAGNode(new Buffer('some data'), l1)

      const l2 = l1.map((l) => {
        return new DAGLink(l.Name, l.Size, l.Hash)
      })

      const node2 = new DAGNode(new Buffer('some data'), l2)

      expect(node2.links).to.be.eql(l2)

      series([
        (sCb) => {
          parallel([
            (cb) => {
              node1.toJSON(cb)
            },
            (cb) => {
              node2.toJSON(cb)
            }
          ], (err, results) => {
            expect(err).to.not.exist
            expect(results[0]).to.be.eql(results[1])
            sCb()
          })
        },
        (sCb) => {
          parallel([
            (cb) => {
              util.serialize(node1, cb)
            },
            (cb) => {
              util.serialize(node2, cb)
            }
          ], (err, results) => {
            expect(err).to.not.exist
            expect(results[0]).to.be.eql(results[1])
            sCb()
          })
        }
      ], done)
    })

    it('create an empty node', function (done) {
      expect(7).checks(done)

      const node = new DAGNode(new Buffer(0))

      expect(node.data.length).to.be.equal(0).mark()
      expect(Buffer.isBuffer(node.data)).to.be.true.mark()

      node.size((err, size) => {
        expect(err).to.not.exist.mark()
        expect(size).to.be.equal(0).mark()
      })

      util.serialize(node, (err, serialized) => {
        expect(err).to.not.exist.mark()

        util.deserialize(serialized, (err, deserialized) => {
          expect(err).to.not.exist.mark()
          expect(node.data).to.eql(deserialized.data).mark()
        })
      })
    })

    it('create a link', function (done) {
      const buf = new Buffer('multihash of file.txt')
      const link = new DAGLink('file.txt', 10, buf)
      expect(link.name).to.equal('file.txt')
      expect(link.size).to.equal(10)
      expect(link.hash.equals(buf)).to.equal(true)
      done()
    })

    it('add a link to a node', function (done) {
      const node1 = new DAGNode(new Buffer('4444'))
      const node2 = new DAGNode(new Buffer('22'))

      let node1Size
      let node1Multihash

      series([
        (cb) => {
          node1.size((err, size) => {
            expect(err).to.not.exist
            node1Size = size
            cb()
          })
        },
        (cb) => {
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            node1Multihash = multihash
            cb()
          })
        },
        (cb) => {
          // Adding the link to the node
          node1.addNodeLink('next', node2, (err) => {
            expect(err).to.not.exist
            expect(node1.links.length).to.be.above(0)
            series([
              (innerCb) => {
                node1.size((err, size) => {
                  expect(err).to.not.exist
                  expect(size).to.be.above(node1Size)
                  innerCb()
                })
              },
              (innerCb) => {
                node1.multihash((err, multihash) => {
                  expect(err).to.not.exist
                  expect(multihash).to.not.eql(node1Multihash)
                  innerCb()
                })
              },
              (innerCB) => {
                node2.multihash((err, multihash) => {
                  expect(err).to.not.exist
                  expect(node1.links[0].hash).to.eql(multihash)
                  innerCB()
                })
              }
            ], cb)
          })
        },
        (cb) => {
          node1.removeNodeLink('next')
          expect(node1.links.length).to.equal(0)
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            expect(multihash).to.eql(node1Multihash)
            cb()
          })
        }
      ], done)
    })

    it('add several links to a node', (done) => {
      const node1 = new DAGNode(new Buffer('4444'))
      const node2 = new DAGNode(new Buffer('22'))
      const node3 = new DAGNode(new Buffer('333'))

      let node1Multihash

      series([
        (cb) => {
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            node1Multihash = multihash
            cb()
          })
        },
        (cb) => {
          node1.addNodeLink('next', node2, cb)
        },
        (cb) => {
          node1.addNodeLink('next', node3, cb)
        },
        (cb) => {
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            expect(multihash).to.not.eql(node1Multihash)
            expect(node1.links.length).to.be.above(1)
            cb()
          })
        }
      ], done)
    })

    it('remove link to a node by hash', function (done) {
      const node1 = new DAGNode(new Buffer('4444'))
      const node2 = new DAGNode(new Buffer('22'))

      let node1Multihash
      let node2Multihash

      series([
        (cb) => {
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            node1Multihash = multihash
            cb()
          })
        },
        (cb) => {
          node2.multihash((err, multihash) => {
            expect(err).to.not.exist
            node2Multihash = multihash
            cb()
          })
        },
        (cb) => {
          node1.addNodeLink('next', node2, cb)
        },
        (cb) => {
          expect(node1.links.length).to.be.above(0)
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            expect(multihash).to.not.eql(node1Multihash)
            cb()
          })
        },
        (cb) => {
          node1.removeNodeLinkByHash(node2Multihash)
          cb()
        },
        (cb) => {
          node1.multihash((err, multihash) => {
            expect(err).to.not.exist
            expect(multihash).to.eql(node1Multihash)
            cb()
          })
        }
      ], done)
    })

    it('get node CID', (done) => {
      const node = new DAGNode(new Buffer('some data'))

      util.cid(node, (err, cid) => {
        expect(err).to.not.exist
        expect(cid.multihash).to.exist
        expect(cid.codec).to.equal('dag-pb')
        expect(cid.version).to.equal(0)
        done()
      })
    })

    it('marshal a node and store it with block-service', (done) => {
      const bs = new BlockService(repo)

      const node = new DAGNode(new Buffer('some data'))

      let cid
      let block

      series([
        (cb) => {
          util.serialize(node, (err, serialized) => {
            expect(err).to.not.exist
            block = new Block(serialized)
            cb()
          })
        },
        (cb) => {
          util.cid(node, (err, _cid) => {
            expect(err).to.not.exist
            cid = _cid
            cb()
          })
        },
        (cb) => {
          bs.put({
            block: block,
            cid: cid
          }, cb)
        },
        (cb) => {
          bs.get(cid, (err, retrievedBlock) => {
            expect(err).to.not.exist
            expect(retrievedBlock.data).to.eql(block.data)
            retrievedBlock.key((err, key) => {
              expect(err).to.not.exist
              expect(key).to.eql(cid.multihash)
              cb()
            })
          })
        },
      ], done)
    })

    it('read a go-ipfs marshalled node and assert it gets read correctly', function (done) {
      const bs = new BlockService(repo)

      const cidStr = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      const cid = new CID(cidStr)

      bs.get(cid, function (err, block) {
        expect(err).to.not.exist
        util.deserialize(block.data, (err, node) => {
          expect(err).to.not.exist
          expect(node.data).to.exist
          expect(node.links.length).to.equal(6)
          done()
        })
      })
    })

    it('dagNode.toJSON with empty Node', (done) => {
      const node = new DAGNode(new Buffer(0))
      node.toJSON((err, obj) => {
        expect(err).to.not.exist
        expect(obj.Data).to.deep.equal(new Buffer(0))
        expect(obj.Links).to.deep.equal([])
        expect(obj.Hash).to.exist
        expect(obj.Size).to.exist
        done()
      })
    })

    it('dagNode.toJSON with data no links', (done) => {
      const node = new DAGNode(new Buffer('La cucaracha'))
      node.toJSON((err, obj) => {
        expect(err).to.not.exist
        expect(obj.Data).to.eql(new Buffer('La cucaracha'))
        expect(obj.Links).to.eql([])
        expect(obj.Hash).to.exist
        expect(obj.Size).to.exist
        done()
      })
    })

    it('dagNode.toJSON with data and links', (done) => {
      const node1 = new DAGNode(new Buffer('hello'))
      const node2 = new DAGNode(new Buffer('world'))

      let node1JSON

      series([
        (cb) => {
          node1.addNodeLink('continuation', node2, cb)
        },
        (cb) => {
          node1.toJSON((err, obj) => {
            expect(err).to.not.exist
            node1JSON = obj
            cb()
          })
        },
        (cb) => {
          expect(node1JSON.Data).to.deep.equal(new Buffer('hello'))
          expect(node1JSON.Links).to.deep.equal([{
            Hash: 'QmPfjpVaf593UQJ9a5ECvdh2x17XuJYG5Yanv5UFnH3jPE',
            Name: 'continuation',
            Size: 7
          }])
          expect(node1JSON.Hash).to.exist
          expect(node1JSON.Size).to.exist
          cb()
        }
      ], done)
    })

    it('create a unnamed dagLink', (done) => {
      const node1 = new DAGNode(new Buffer('1'))
      const node2 = new DAGNode(new Buffer('2'))

      let node1JSON

      series([
        (cb) => {
          node1.addNodeLink('', node2, cb)
        },
        (cb) => {
          node1.toJSON((err, obj) => {
            expect(err).to.not.exist
            node1JSON = obj
            cb()
          })
        },
        (cb) => {
          expect(node1JSON.Data).to.deep.equal(new Buffer('1'))
          expect(node1JSON.Links).to.deep.equal([{
            Hash: 'QmNRGfMaSjNcjtyS56JrZBEU5QcGtfViWWG8V9pVqgVpmT',
            Name: '',
            Size: 3
          }])
          expect(node1JSON.Hash).to.exist
          expect(node1JSON.Size).to.exist
          cb()
        }
      ], done)
    })

    it('add two nameless links to a node', () => {
      const l1 = {
        Name: '',
        Hash: 'QmbAmuwox51c91FmC2jEX5Ng4zS4HyVgpA5GNPBF5QsWMA',
        Size: 57806
      }

      const l2 = {
        Name: '',
        Hash: 'QmP7SrR76KHK9A916RbHG1ufy2TzNABZgiE23PjZDMzZXy',
        Size: 262158
      }

      const link1 = new DAGLink(l1.Name, l1.Size, new Buffer(bs58.decode(l1.Hash)))
      const link2 = new DAGLink(l2.Name, l2.Size, new Buffer(bs58.decode(l2.Hash)))

      function createNode () {
        return new DAGNode(new Buffer('hiya'), [link1, link2])
      }

      expect(createNode).to.not.throw()
    })

    it('toString', (done) => {
      const node = new DAGNode(new Buffer('hello world'))
      node.toString((err, str) => {
        expect(err).to.not.exist
        const expected = 'DAGNode <QmU1Sq1B7RPQD2XcQNLB58qJUyJffVJqihcxmmN1STPMxf - data: "hello world", links: 0, size: 13>'
        expect(str).to.equal(expected)
        done()
      })
    })
  })
}
