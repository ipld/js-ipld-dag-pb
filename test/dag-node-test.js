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
const waterfall = require('async/waterfall')
const isNode = require('detect-node')
const multihash = require('multihashes')

const BlockService = require('ipfs-block-service')
const Block = require('ipfs-block')
const CID = require('cids')
const bs58 = require('bs58')
const loadFixture = require('aegir/fixtures')

const testBlockNamedLinks = loadFixture('test/fixtures/test-block-named-links')
const testBlockUnnamedLinks = loadFixture('test/fixtures/test-block-unnamed-links')

module.exports = (repo) => {
  const bs = new BlockService(repo)

  describe('DAGNode', () => {
    it('create a node', (done) => {
      expect(7).checks(done)
      const data = Buffer.from('some data')

      DAGNode.create(data, (err, node) => {
        expect(err).to.not.exist.mark()
        expect(node.data.length).to.be.above(0).mark()
        expect(Buffer.isBuffer(node.data)).to.be.true.mark()
        expect(node.size).to.be.above(0).mark()

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
      const someData = Buffer.from('some data')

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

        // check sorting
        expect(node1.links.map((l) => l.name)).to.be.eql([
          'some link',
          'some other link'
        ])
        done()
      })
    })

    it('create with empty link name', (done) => {
      DAGNode.create(Buffer.from('hello'), [
        new DAGLink('', 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ], (err, node) => {
        expect(err).to.not.exist()
        expect(node.links[0].name).to.be.eql('')
        done()
      })
    })

    it('create with undefined link name', (done) => {
      waterfall([
        (cb) => DAGNode.create(Buffer.from('hello'), [
          new DAGLink(undefined, 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
        ], cb),
        (node, cb) => {
          expect(node.links[0].name).to.be.eql('')

          waterfall([
            (cb) => dagPB.util.serialize(node, cb),
            (buffer, cb) => dagPB.util.deserialize(buffer, cb),
            (deserialized, cb) => {
              Object.getOwnPropertyNames(node).forEach(key => {
                expect(node[key]).to.deep.equal(deserialized[key])
              })

              cb()
            }
          ], cb)
        }
      ], done)
    })

    it('create an empty node', (done) => {
      // this node is not in the repo as we don't copy node data to the browser
      expect(7).checks(done)

      DAGNode.create(Buffer.alloc(0), (err, node) => {
        expect(err).to.not.exist.mark()
        expect(node.data.length).to.be.equal(0).mark()
        expect(Buffer.isBuffer(node.data)).to.be.true.mark()
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
          DAGNode.create(Buffer.from('1'), (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.addLink(node1, node2, (err, node1b) => {
            expect(err).to.not.exist()
            expect(node1b.links.length).to.equal(1)
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

      waterfall([
        (cb) => {
          DAGNode.create(Buffer.from('1'), (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => toDAGLink(node2, cb),
        (link, cb) => {
          DAGNode.addLink(node1, link, (err, node1b) => {
            expect(err).to.not.exist()
            expect(node1b.links.length).to.equal(1)
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

      waterfall([
        (cb) => {
          DAGNode.create(Buffer.from('1'), (err, node) => {
            expect(err).to.not.exist()
            node1 = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => toDAGLink(node2, cb),
        (link, cb) => {
          const linkObject = link.toJSON()
          DAGNode.addLink(node1, linkObject, (err, node1b) => {
            expect(err).to.not.exist()
            expect(node1b.links.length).to.equal(1)
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
          DAGNode.create(Buffer.from('1'), (err, node) => {
            expect(err).to.not.exist()
            node1a = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('2'), (err, node) => {
            expect(err).to.not.exist()
            DAGNode.addLink(node1a, node, (err, node) => {
              expect(err).to.not.exist()
              node1b = node
              cb()
            })
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('3'), (err, node) => {
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

      waterfall([
        (cb) => {
          DAGNode.create(Buffer.from('1'), (err, node) => {
            expect(err).to.not.exist()
            node1a = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => toDAGLink(node2, {
          name: 'banana'
        }, cb),
        (link, cb) => {
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

      waterfall([
        (cb) => {
          DAGNode.create(Buffer.from('1'), (err, node) => {
            expect(err).to.not.exist()
            node1a = node
            cb()
          })
        },
        (cb) => {
          DAGNode.create(Buffer.from('2'), (err, node) => {
            expect(err).to.not.exist()
            node2 = node
            cb()
          })
        },
        (cb) => toDAGLink(node2, {
          name: 'banana'
        }, cb),
        (link, cb) => {
          DAGNode.addLink(node1a, link, (err, node) => {
            expect(err).to.not.exist()
            node1b = node
            cb()
          })
        },
        (cb) => {
          DAGNode.rmLink(node1b, node1b.links[0].cid, (err, node) => {
            expect(err).to.not.exist()
            expect(node1a.toJSON()).to.eql(node.toJSON())
            cb()
          })
        }
      ], done)
    })

    it('get node CID', (done) => {
      DAGNode.create(Buffer.from('some data'), (err, node) => {
        expect(err).to.not.exist()
        util.cid(node, (err, cid) => {
          expect(err).to.not.exist()
          expect(cid.multihash).to.exist()
          expect(cid.codec).to.equal('dag-pb')
          expect(cid.version).to.equal(0)
          const mh = multihash.decode(cid.multihash)
          expect(mh.name).to.equal('sha2-256')
          done()
        })
      })
    })

    it('get node CID with hashAlg', (done) => {
      DAGNode.create(Buffer.from('some data'), (err, node) => {
        expect(err).to.not.exist()
        util.cid(node, { hashAlg: 'sha2-512' }, (err, cid) => {
          expect(err).to.not.exist()
          expect(cid.multihash).to.exist()
          expect(cid.codec).to.equal('dag-pb')
          expect(cid.version).to.equal(1)
          const mh = multihash.decode(cid.multihash)
          expect(mh.name).to.equal('sha2-512')
          done()
        })
      })
    })

    it('marshal a node and store it with block-service', (done) => {
      DAGNode.create(Buffer.from('some data'), (err, node) => {
        expect(err).to.not.exist()
        let block

        waterfall([
          (cb) => dagPB.util.serialize(node, cb),
          (s, cb) => dagPB.util.cid(s, (err, cid) => {
            cb(err, {
              buffer: s,
              cid: cid
            })
          }),
          ({ buffer, cid }, cb) => {
            block = new Block(buffer, cid)
            bs.put(block, cb)
          },
          (cb) => bs.get(block.cid, cb),
          (retrievedBlock, cb) => {
            expect(retrievedBlock).to.eql(block)
            cb()
          }
        ], done)
      })
    })

    it('deserialize go-ipfs block from ipldResolver', (done) => {
      if (!isNode) {
        return done()
      }

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
          cid: 'QmSbCgdsX12C4KDw3PDmpBN9iCzS87a5DjgSCoW9esqzXk',
          multihash: 'QmSbCgdsX12C4KDw3PDmpBN9iCzS87a5DjgSCoW9esqzXk',
          size: 45623854
        },
        {
          name: '',
          cid: 'Qma4GxWNhywSvWFzPKtEswPGqeZ9mLs2Kt76JuBq9g3fi2',
          multihash: 'Qma4GxWNhywSvWFzPKtEswPGqeZ9mLs2Kt76JuBq9g3fi2',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmQfyxyys7a1e3mpz9XsntSsTGc8VgpjPj5BF1a1CGdGNc',
          multihash: 'QmQfyxyys7a1e3mpz9XsntSsTGc8VgpjPj5BF1a1CGdGNc',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmSh2wTTZT4N8fuSeCFw7wterzdqbE93j1XDhfN3vQHzDV',
          multihash: 'QmSh2wTTZT4N8fuSeCFw7wterzdqbE93j1XDhfN3vQHzDV',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmVXsSVjwxMsCwKRCUxEkGb4f4B98gXVy3ih3v4otvcURK',
          multihash: 'QmVXsSVjwxMsCwKRCUxEkGb4f4B98gXVy3ih3v4otvcURK',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmZjhH97MEYwQXzCqSQbdjGDhXWuwW4RyikR24pNqytWLj',
          multihash: 'QmZjhH97MEYwQXzCqSQbdjGDhXWuwW4RyikR24pNqytWLj',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmRs6U5YirCqC7taTynz3x2GNaHJZ3jDvMVAzaiXppwmNJ',
          multihash: 'QmRs6U5YirCqC7taTynz3x2GNaHJZ3jDvMVAzaiXppwmNJ',
          size: 32538395
        }
      ]

      dagPB.util.deserialize(buf, (err, node) => {
        expect(err).to.not.exist()
        const nodeJSON = node.toJSON()
        expect(nodeJSON.links).to.eql(expectedLinks)

        dagPB.util.cid(node, (err, cid) => {
          expect(err).to.not.exist()
          expect(cid.toBaseEncodedString()).to.eql('QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX')
          done()
        })
      })
    })

    it('deserialize go-ipfs block with named links', (done) => {
      const buf = testBlockNamedLinks

      const expectedLinks = [
        {
          name: 'audio_only.m4a',
          cid: 'QmaUAwAQJNtvUdJB42qNbTTgDpzPYD1qdsKNtctM5i7DGB',
          multihash: 'QmaUAwAQJNtvUdJB42qNbTTgDpzPYD1qdsKNtctM5i7DGB',
          size: 23319629
        },
        {
          name: 'chat.txt',
          cid: 'QmNVrxbB25cKTRuKg2DuhUmBVEK9NmCwWEHtsHPV6YutHw',
          multihash: 'QmNVrxbB25cKTRuKg2DuhUmBVEK9NmCwWEHtsHPV6YutHw',
          size: 996
        },
        {
          name: 'playback.m3u',
          cid: 'QmUcjKzDLXBPmB6BKHeKSh6ZoFZjss4XDhMRdLYRVuvVfu',
          multihash: 'QmUcjKzDLXBPmB6BKHeKSh6ZoFZjss4XDhMRdLYRVuvVfu',
          size: 116
        },
        {
          name: 'zoom_0.mp4',
          cid: 'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX',
          multihash: 'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX',
          size: 306281879
        }
      ]

      dagPB.util.deserialize(buf, (err, node) => {
        expect(err).to.not.exist()
        const nodeJSON = node.toJSON()
        expect(nodeJSON.links).to.eql(expectedLinks)

        dagPB.util.cid(node, (err, cid) => {
          expect(err).to.not.exist()
          expect(cid.toBaseEncodedString()).to.eql('QmbSAC58x1tsuPBAoarwGuTQAgghKvdbKSBC8yp5gKCj5M')
          done()
        })
      })
    })

    it('dagNode.toJSON with empty Node', (done) => {
      DAGNode.create(Buffer.alloc(0), (err, node) => {
        expect(err).to.not.exist()
        expect(node.toJSON().data).to.eql(Buffer.alloc(0))
        expect(node.toJSON().links).to.eql([])
        expect(node.toJSON().size).to.exist()
        done()
      })
    })

    it('dagNode.toJSON with data no links', (done) => {
      const data = Buffer.from('La cucaracha')
      DAGNode.create(data, (err, node) => {
        expect(err).to.not.exist()
        expect(node.toJSON().data).to.eql(data)
        expect(node.toJSON().links).to.eql([])
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

      const link1 = new DAGLink(l1.Name, l1.Size, Buffer.from(bs58.decode(l1.Hash)))
      const link2 = new DAGLink(l2.Name, l2.Size, Buffer.from(bs58.decode(l2.Hash)))

      DAGNode.create(Buffer.from('hiya'), [link1, link2], (err, node) => {
        expect(err).to.not.exist()
        done()
      })
    })

    it('toString', (done) => {
      DAGNode.create(Buffer.from('hello world'), (err, node) => {
        expect(err).to.not.exist()
        const expected = 'DAGNode <data: "aGVsbG8gd29ybGQ=", links: 0, size: 13>'
        expect(node.toString()).to.equal(expected)
        done()
      })
    })

    it('deserializing a node and an object should yield the same result', (done) => {
      expect(10).checks(done)
      const obj = {
        data: Buffer.from('Hello World'),
        links: [{
          multihash: 'QmUxD5gZfKzm8UN4WaguAMAZjw2TzZ2ZUmcqm2qXPtais7',
          name: 'payload',
          size: 819
        }]
      }

      DAGNode.create(obj.data, obj.links, (err, node) => {
        expect(err).to.not.exist.mark()
        expect(node.data.length).to.be.above(0).mark()
        expect(Buffer.isBuffer(node.data)).to.be.true.mark()
        expect(node.size).to.be.above(0).mark()

        dagPB.util.serialize(node, (err, serialized) => {
          expect(err).to.not.exist.mark()
          dagPB.util.serialize(obj, (err, serializedObject) => {
            expect(err).to.not.exist.mark()
            dagPB.util.deserialize(serialized, (err, deserialized) => {
              expect(err).to.not.exist.mark()
              dagPB.util.deserialize(serializedObject, (err, deserializedObject) => {
                expect(err).to.not.exist.mark()
                expect(deserialized.toJSON()).to.deep.equal(deserializedObject.toJSON()).mark()
                done()
              })
            })
          })
        })
      })
    }).timeout(6000)
  })
}
