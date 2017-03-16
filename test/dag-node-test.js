/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const checkmark = require('chai-checkmark')
const expect = chai.expect
chai.use(dirtyChai)
chai.use(checkmark)

const dagPB = require('../src')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const toDAGLink = require('../src/dag-node/util').toDAGLink
const util = dagPB.util
const series = require('async/series')

const BlockService = require('ipfs-block-service')
const Block = require('ipfs-block')
const CID = require('cids')
const bs58 = require('bs58')
const loadFixture = require('aegir/fixtures')

const testBlockNamedLinks = loadFixture(__dirname, '/fixtures/test-block-named-links')
const testBlockUnnamedLinks = loadFixture(__dirname, '/fixtures/test-block-unnamed-links')

module.exports = (repo) => {
  describe('DAGNode', () => {
    it('create a node', (done) => {
      expect(7).checks(done)
      const data = new Buffer('some data')

      DAGNode.create(data, (err, node) => {
        expect(err).to.not.exist.mark()
        expect(node.data.length).to.be.above(0).mark()
        expect(Buffer.isBuffer(node.data)).to.be.true.mark()
        expect(node.size).to.be.above(0).mark()
        expect(node.toJSON().multihash).to.be.equal('Qmd7xRhW5f29QuBFtqu3oSD27iVy35NRB91XFjmKFhtgMr')

        dagPB.util.serialize(node, (err, serialized) => {
          expect(err).to.not.exist.mark()

          dagPB.util.deserialize(serialized, (err, deserialized) => {
            expect(err).to.not.exist.mark()
            expect(node.data).to.eql(deserialized.data).mark()
          })
        })
      })
    })

    it('create a node with string data', (done) => {
      expect(7).checks(done)
      const data = 'some data'

      DAGNode.create(data, (err, node) => {
        expect(err).to.not.exist.mark()
        expect(node.data.length).to.be.above(0).mark()
        expect(Buffer.isBuffer(node.data)).to.be.true.mark()
        expect(node.size).to.be.above(0).mark()
        expect(node.toJSON().multihash).to.be.equal('Qmd7xRhW5f29QuBFtqu3oSD27iVy35NRB91XFjmKFhtgMr')

        dagPB.util.serialize(node, (err, serialized) => {
          expect(err).to.not.exist.mark()

          dagPB.util.deserialize(serialized, (err, deserialized) => {
            expect(err).to.not.exist.mark()
            expect(node.data).to.eql(deserialized.data).mark()
          })
        })
      })
    })

    it('create a node with links', (done) => {
      const l1 = [{
        Name: 'some other link',
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
        Size: 8
      }, {
        Name: 'some link',
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
        Size: 10
      }]

      let node1
      let node2
      const someData = new Buffer('some data')

      series([
        (cb) => {
          DAGNode.create(someData, l1, (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          const l2 = l1.map((l) => {
            return new DAGLink(l.Name, l.Size, l.Hash)
          })

          DAGNode.create(someData, l2, (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            expect(node2.links).to.eql([l2[1], l2[0]])
            cb()
          })
        }
      ], (err) => {
        expect(err).to.not.exist()
        expect(node1.toJSON()).to.eql(node2.toJSON())
        expect(node1.serialized).to.eql(node2.serialized)

        // check sorting
        expect(node1.links.map((l) => l.name)).to.be.eql([
          'some link',
          'some other link'
        ])
        done()
      })
    })

    it('create with empty link name', (done) => {
      DAGNode.create(new Buffer('hello'), [
        new DAGLink('', 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ], (err, node) => {
        expect(err).to.not.exist()
        expect(node.links[0].name).to.be.eql('')
        done()
      })
    })

    it('create an empty node', (done) => {
      expect(7).checks(done)
      const fromGoIPFS = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n'

      DAGNode.create(new Buffer(0), (err, node) => {
        expect(err).to.not.exist.mark()
        expect(node.data.length).to.be.equal(0).mark()
        expect(Buffer.isBuffer(node.data)).to.be.true.mark()
        expect(node.toJSON().multihash).to.eql(fromGoIPFS)
        expect(node.size).to.be.equal(0).mark()

        dagPB.util.serialize(node, (err, serialized) => {
          expect(err).to.not.exist.mark()

          dagPB.util.deserialize(serialized, (err, deserialized) => {
            expect(err).to.not.exist.mark()
            expect(node.data).to.eql(deserialized.data).mark()
          })
        })
      })
    })

    it('fail to create a node with other data types', (done) => {
      DAGNode.create({}, (err, node) => {
        expect(err).to.exist()
        expect(node).to.not.exist()
        DAGNode.create([], (err, node) => {
          expect(err).to.exist()
          expect(node).to.not.exist()
          done()
        })
      })
    })

    it('addLink by DAGNode', (done) => {
      let node1
      let node2

      series([
        (cb) => {
          DAGNode.create(new Buffer('1'), (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.addLink(node1, node2, (err, node1b) => {
            expect(err).to.not.exist()
            expect(node1b.links.length).to.equal(1)
            expect(node1b.links[0].multihash)
              .to.eql(node2.multihash)
            expect(node1b.links[0].size)
              .to.eql(node2.size)
            expect(node1b.links[0].name).to.be.eql('')
            cb()
          })
        }
      ], done)
    })

    it('addLink by DAGLink', (done) => {
      let node1
      let node2

      series([
        (cb) => {
          DAGNode.create(new Buffer('1'), (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => {
          const link = toDAGLink(node2)

          DAGNode.addLink(node1, link, (err, node1b) => {
            expect(err).to.not.exist()
            expect(node1b.links.length).to.equal(1)
            expect(node1b.links[0].multihash)
              .to.eql(node2.multihash)
            expect(node1b.links[0].size)
              .to.eql(node2.size)
            expect(node1b.links[0].name).to.be.eql('')
            cb()
          })
        }
      ], done)
    })

    it('addLink by object', (done) => {
      let node1
      let node2

      series([
        (cb) => {
          DAGNode.create(new Buffer('1'), (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => {
          const link = toDAGLink(node2).toJSON()

          DAGNode.addLink(node1, link, (err, node1b) => {
            expect(err).to.not.exist()
            expect(node1b.links.length).to.equal(1)
            expect(node1b.links[0].multihash)
              .to.eql(node2.multihash)
            expect(node1b.links[0].size)
              .to.eql(node2.size)
            expect(node1b.links[0].name).to.be.eql('')
            cb()
          })
        }
      ], done)
    })

    it('addLink - add several links', (done) => {
      let node1a
      let node1b
      let node1c

      series([
        (cb) => {
          DAGNode.create(new Buffer('1'), (err, node) => {
            expect(err).to.not.exist()
            node1a = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('2'), (err, node) => {
            expect(err).to.not.exist()
            DAGNode.addLink(node1a, node, (err, node) => {
              expect(err).to.not.exist()
              node1b = node
              cb()
            })
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('3'), (err, node) => {
            expect(err).to.not.exist()
            DAGNode.addLink(node1b, node, (err, node) => {
              expect(err).to.not.exist()
              node1c = node
              cb()
            })
          })
        },
        (cb) => {
          expect(node1a.links.length).to.equal(0)
          expect(node1b.links.length).to.equal(1)
          expect(node1c.links.length).to.equal(2)
          cb()
        }
      ], done)
    })

    it('rmLink by name', (done) => {
      let node1a
      let node1b
      let node2

      series([
        (cb) => {
          DAGNode.create(new Buffer('1'), (err, node) => {
            expect(err).to.not.exist()
            node1a = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => {
          const link = toDAGLink(node2).toJSON()
          link.name = 'banana'

          DAGNode.addLink(node1a, link, (err, node) => {
            expect(err).to.not.exist()
            node1b = node
            cb()
          })
        },
        (cb) => {
          DAGNode.rmLink(node1b, 'banana', (err, node) => {
            expect(err).to.not.exist()
            expect(node1a.toJSON()).to.eql(node.toJSON())
            cb()
          })
        }
      ], done)
    })

    it('rmLink by hash', (done) => {
      let node1a
      let node1b
      let node2

      series([
        (cb) => {
          DAGNode.create(new Buffer('1'), (err, node) => {
            expect(err).to.not.exist()
            node1a = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(new Buffer('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => {
          const link = toDAGLink(node2).toJSON()
          link.name = 'banana'

          DAGNode.addLink(node1a, link, (err, node) => {
            expect(err).to.not.exist()
            node1b = node
            cb()
          })
        },
        (cb) => {
          DAGNode.rmLink(node1b, node2.multihash, (err, node) => {
            expect(err).to.not.exist()
            expect(node1a.toJSON()).to.eql(node.toJSON())
            cb()
          })
        }
      ], done)
    })

    it('get node CID', (done) => {
      DAGNode.create(new Buffer('some data'), (err, node) => {
        expect(err).to.not.exist()
        util.cid(node, (err, cid) => {
          expect(err).to.not.exist()
          expect(cid.multihash).to.exist()
          expect(cid.codec).to.equal('dag-pb')
          expect(cid.version).to.equal(0)
          done()
        })
      })
    })

    it('marshal a node and store it with block-service', (done) => {
      const bs = new BlockService(repo)

      DAGNode.create(new Buffer('some data'), (err, node) => {
        expect(err).to.not.exist()
        let cid
        let block

        series([
          (cb) => {
            dagPB.util.serialize(node, (err, serialized) => {
              expect(err).to.not.exist()
              block = new Block(serialized)
              cb()
            })
          },
          (cb) => {
            util.cid(node, (err, _cid) => {
              expect(err).to.not.exist()
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
              expect(err).to.not.exist()
              expect(retrievedBlock.data).to.eql(block.data)
              retrievedBlock.key((err, key) => {
                expect(err).to.not.exist()
                expect(key).to.eql(cid.multihash)
                cb()
              })
            })
          }
        ], done)
      })
    })

    it('deserialize go-ipfs block from ipldResolver', (done) => {
      const bs = new BlockService(repo)

      const cidStr = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      const cid = new CID(cidStr)

      bs.get(cid, (err, block) => {
        expect(err).to.not.exist()
        dagPB.util.deserialize(block.data, (err, node) => {
          expect(err).to.not.exist()
          expect(node.data).to.exist()
          expect(node.links.length).to.equal(6)
          done()
        })
      })
    })

    it('deserialize go-ipfs block with unnamed links', (done) => {
      const buf = testBlockUnnamedLinks

      const expectedLinks = [
        {
          name: '',
          multihash: 'QmSbCgdsX12C4KDw3PDmpBN9iCzS87a5DjgSCoW9esqzXk',
          size: 45623854
        },
        {
          name: '',
          multihash: 'Qma4GxWNhywSvWFzPKtEswPGqeZ9mLs2Kt76JuBq9g3fi2',
          size: 45623854
        },
        {
          name: '',
          multihash: 'QmQfyxyys7a1e3mpz9XsntSsTGc8VgpjPj5BF1a1CGdGNc',
          size: 45623854
        },
        {
          name: '',
          multihash: 'QmSh2wTTZT4N8fuSeCFw7wterzdqbE93j1XDhfN3vQHzDV',
          size: 45623854
        },
        {
          name: '',
          multihash: 'QmVXsSVjwxMsCwKRCUxEkGb4f4B98gXVy3ih3v4otvcURK',
          size: 45623854
        },
        {
          name: '',
          multihash: 'QmZjhH97MEYwQXzCqSQbdjGDhXWuwW4RyikR24pNqytWLj',
          size: 45623854
        },
        {
          name: '',
          multihash: 'QmRs6U5YirCqC7taTynz3x2GNaHJZ3jDvMVAzaiXppwmNJ',
          size: 32538395
        }
      ]

      dagPB.util.deserialize(buf, (err, node) => {
        expect(err).to.not.exist()
        const nodeJSON = node.toJSON()
        expect(nodeJSON.links).to.eql(expectedLinks)
        expect(nodeJSON.multihash).to.eql('QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX')
        done()
      })
    })

    it('deserialize go-ipfs block with named links', (done) => {
      const buf = testBlockNamedLinks

      const expectedLinks = [
        {
          name: 'audio_only.m4a',
          multihash: 'QmaUAwAQJNtvUdJB42qNbTTgDpzPYD1qdsKNtctM5i7DGB',
          size: 23319629
        },
        {
          name: 'chat.txt',
          multihash: 'QmNVrxbB25cKTRuKg2DuhUmBVEK9NmCwWEHtsHPV6YutHw',
          size: 996
        },
        {
          name: 'playback.m3u',
          multihash: 'QmUcjKzDLXBPmB6BKHeKSh6ZoFZjss4XDhMRdLYRVuvVfu',
          size: 116
        },
        {
          name: 'zoom_0.mp4',
          multihash: 'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX',
          size: 306281879
        }
      ]

      dagPB.util.deserialize(buf, (err, node) => {
        expect(err).to.not.exist()
        const nodeJSON = node.toJSON()
        expect(nodeJSON.links).to.eql(expectedLinks)
        expect(nodeJSON.multihash).to.eql('QmbSAC58x1tsuPBAoarwGuTQAgghKvdbKSBC8yp5gKCj5M')
        done()
      })
    })

    it('dagNode.toJSON with empty Node', (done) => {
      DAGNode.create(new Buffer(0), (err, node) => {
        expect(err).to.not.exist()
        expect(node.toJSON().data).to.eql(new Buffer(0))
        expect(node.toJSON().links).to.eql([])
        expect(node.toJSON().multihash).to.exist()
        expect(node.toJSON().size).to.exist()
        done()
      })
    })

    it('dagNode.toJSON with data no links', (done) => {
      const data = new Buffer('La cucaracha')
      DAGNode.create(data, (err, node) => {
        expect(err).to.not.exist()
        expect(node.toJSON().data).to.eql(data)
        expect(node.toJSON().links).to.eql([])
        expect(node.toJSON().multihash).to.exist()
        expect(node.toJSON().size).to.exist()
        done()
      })
    })

    it('add two nameless links to a node', (done) => {
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

      DAGNode.create(new Buffer('hiya'), [link1, link2], (err, node) => {
        expect(err).to.not.exist()
        done()
      })
    })

    it('toString', (done) => {
      DAGNode.create(new Buffer('hello world'), (err, node) => {
        expect(err).to.not.exist()
        const expected = 'DAGNode <QmU1Sq1B7RPQD2XcQNLB58qJUyJffVJqihcxmmN1STPMxf - data: "hello world", links: 0, size: 13>'
        expect(node.toString()).to.equal(expected)
        done()
      })
    })
  })
}
