/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */
'use strict'

const chai = require('chai')
const chaiAsProised = require('chai-as-promised')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(chaiAsProised)
chai.use(dirtyChai)

const dagPB = require('../src')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const toDAGLink = require('../src/dag-node/util').toDAGLink
const util = dagPB.util
const series = require('async/series')
const waterfall = require('async/waterfall')
const isNode = require('detect-node')
const multicodec = require('multicodec')
const multihash = require('multihashes')
const str2ab = require('array-buffer-from-string')

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
    it('create a node', async () => {
      const data = Buffer.from('some data')

      const node = await DAGNode.create(data)
      expect(node.data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.data)).to.be.true()
      expect(node.size).to.be.above(0)

      const serialized = await dagPB.serialize(node)
      const deserialized = await dagPB.deserialize(serialized)
      expect(node.data).to.eql(deserialized.data)
    })

    it('create a node with string data', async () => {
      const data = 'some data'

      const node = await DAGNode.create(data)
      expect(node.data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.data)).to.be.true()
      expect(node.size).to.be.above(0)

      const serialized = await dagPB.serialize(node)
      const deserialized = await dagPB.deserialize(serialized)
      expect(node.data).to.eql(deserialized.data)
    })

    it('create a node with links', async () => {
      const l1 = [{
        name: 'some other link',
        cid: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'),
        size: 8
      }, {
        name: 'some link',
        cid: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'),
        size: 10
      }]

      const someData = Buffer.from('some data')

      const node1 = await DAGNode.create(someData, l1)
      const l2 = l1.map((l) => {
        return new DAGLink(l.name, l.size, l.cid)
      })

      const node2 = await DAGNode.create(someData, l2)
      expect(node2.links).to.eql([l1[1], l1[0]])
      expect(node1.toJSON()).to.eql(node2.toJSON())

      // check sorting
      expect(node1.links.map((l) => l.name)).to.be.eql([
        'some link',
        'some other link'
      ])
    })

    it('create with empty link name', async () => {
      const node = await DAGNode.create(Buffer.from('hello'), [
        new DAGLink('', 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ])
      expect(node.links[0].name).to.be.eql('')
    })

    it('create with undefined link name', async () => {
      const node = await DAGNode.create(Buffer.from('hello'), [
        new DAGLink(undefined, 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ])
      expect(node.links[0].name).to.be.eql('')

      const serialized = await dagPB.serialize(node)
      const deserialized = await dagPB.deserialize(serialized)
      Object.getOwnPropertyNames(node).forEach(key => {
        expect(node[key]).to.deep.equal(deserialized[key])
      })
    })

    it('create an empty node', async () => {
      // this node is not in the repo as we don't copy node data to the browser
      const node = await DAGNode.create(Buffer.alloc(0))
      expect(node.data.length).to.be.equal(0)
      expect(Buffer.isBuffer(node.data)).to.be.true()
      expect(node.size).to.be.equal(0)

      const serialized = await dagPB.serialize(node)
      const deserialized = await dagPB.deserialize(serialized)
      expect(node.data).to.eql(deserialized.data)
    })

    it('fail to create a node with other data types', async () => {
      await expect(DAGNode.create({})).to.be.rejectedWith(
        'Passed \'data\' is not a buffer or a string!'
      )
      await expect(DAGNode.create([])).to.be.rejectedWith(
        'Passed \'data\' is not a buffer or a string!'
      )
    })

    it('addLink by DAGNode', async () => {
      const node1 = await DAGNode.create(Buffer.from('1'))
      const node2 = await DAGNode.create(Buffer.from('2'))
      await DAGNode.addLink(node1, node2)
      expect(node1.links.length).to.equal(1)
      expect(node1.links[0].size).to.eql(node2.size)
      expect(node1.links[0].name).to.be.eql('')
    })

    it('addLink by DAGLink', async () => {
      const node1 = await DAGNode.create(Buffer.from('1'))
      const node2 = await DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2)
      await DAGNode.addLink(node1, link)
      expect(node1.links.length).to.equal(1)
      expect(node1.links[0].size).to.eql(node2.size)
      expect(node1.links[0].name).to.be.eql('')
    })

    it('addLink by object', async () => {
      const node1 = await DAGNode.create(Buffer.from('1'))
      const node2 = await DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2)
      const linkObject = link.toJSON()
      await DAGNode.addLink(node1, linkObject)
      expect(node1.links.length).to.equal(1)
      expect(node1.links[0].size).to.eql(node2.size)
      expect(node1.links[0].name).to.be.eql('')
    })

    it('addLink by with name', async () => {
      const node1 = await DAGNode.create(Buffer.from('1'))
      const node2 = await DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2, { name: 'banana' })
      expect(Object.keys(node1)).to.not.include('banana')
      await DAGNode.addLink(node1, link)
      expect(node1.links.length).to.equal(1)
      expect(node1.links[0].size).to.eql(node2.size)
      expect(node1.links[0].name).to.eql('banana')
      expect(Object.keys(node1)).to.include('banana')
    })

    it('addLink - add several links', async () => {
      const node = await DAGNode.create(Buffer.from('1'))
      expect(node.links.length).to.equal(0)

      const node2 = await DAGNode.create(Buffer.from('2'))
      await DAGNode.addLink(node, node2)
      expect(node.links.length).to.equal(1)

      const node3 = await DAGNode.create(Buffer.from('3'))
      await DAGNode.addLink(node, node3)
      expect(node.links.length).to.equal(2)
    })

    it('rmLink by name', async () => {
      const node = await DAGNode.create(Buffer.from('1'))
      expect(node.links.length).to.eql(0)
      const withoutLink = node.toJSON()

      const node2 = await DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2, { name: 'banana' })

      await DAGNode.addLink(node, link)
      expect(node.links.length).to.eql(1)
      expect(Object.keys(node)).to.include('banana')
      DAGNode.rmLink(node, 'banana')
      expect(Object.keys(node)).to.not.include('banana')
      expect(node.links.length).to.eql(0)
      expect(node.toJSON()).to.eql(withoutLink)
    })

    it('rmLink by hash', async () => {
      const node = await DAGNode.create(Buffer.from('1'))
      expect(node.links.length).to.eql(0)
      const withoutLink = node.toJSON()

      const node2 = await DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2, { name: 'banana' })

      await DAGNode.addLink(node, link)
      expect(node.links.length).to.eql(1)
      expect(Object.keys(node)).to.include('banana')
      DAGNode.rmLink(node, node.links[0].cid)
      expect(Object.keys(node)).to.not.include('banana')
      expect(node.links.length).to.eql(0)
      expect(node.toJSON()).to.eql(withoutLink)
    })

    it('get node CID', async () => {
      const node = await DAGNode.create(Buffer.from('some data'))
      const serialized = await dagPB.serialize(node)
      const cid = await dagPB.cid(serialized)
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(1)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-256')
    })

    it('get node CID with version', async () => {
      const node = await DAGNode.create(Buffer.from('some data'))
      const serialized = await dagPB.serialize(node)
      const cid = await dagPB.cid(serialized, { version: 0 })
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(0)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-256')
    })

    it('get node CID with hashAlg', async () => {
      const node = await DAGNode.create(Buffer.from('some data'))
      const serialized = await dagPB.serialize(node)
      const cid = await dagPB.cid(serialized, { hashAlg: 'sha2-512' })
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(1)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-512')
    })

    it('marshal a node and store it with block-service', async () => {
      const node = await DAGNode.create(Buffer.from('some data'))
      const serialized = await dagPB.serialize(node)
      const cid = await dagPB.cid(serialized)
      const block = new Block(Buffer.from(serialized), cid)
      return new Promise((resolve) => {
        bs.put(block, (err) => {
          expect(err).to.not.exist()
          bs.get(block.cid, (err, retrievedBlock) => {
            expect(err).to.not.exist()
            expect(retrievedBlock).to.eql(block)
            resolve()
          })
        })
      })
    })

    it('deserialize go-ipfs block from ipldResolver', async () => {
      if (!isNode) {
        return
      }

      const cidStr = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      const cid = new CID(cidStr)

      return new Promise((resolve) => {
        bs.get(cid, async(err, block) => {
          expect(err).to.not.exist()
          const node = await dagPB.deserialize(block.data)
          expect(node.data).to.exist()
          expect(node.links.length).to.equal(6)
          resolve()
        })
      })
    })

    it('deserialize go-ipfs block with unnamed links', async () => {
      const buf = testBlockUnnamedLinks

      const expectedLinks = [
        {
          name: '',
          cid: 'QmSbCgdsX12C4KDw3PDmpBN9iCzS87a5DjgSCoW9esqzXk',
          size: 45623854
        },
        {
          name: '',
          cid: 'Qma4GxWNhywSvWFzPKtEswPGqeZ9mLs2Kt76JuBq9g3fi2',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmQfyxyys7a1e3mpz9XsntSsTGc8VgpjPj5BF1a1CGdGNc',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmSh2wTTZT4N8fuSeCFw7wterzdqbE93j1XDhfN3vQHzDV',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmVXsSVjwxMsCwKRCUxEkGb4f4B98gXVy3ih3v4otvcURK',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmZjhH97MEYwQXzCqSQbdjGDhXWuwW4RyikR24pNqytWLj',
          size: 45623854
        },
        {
          name: '',
          cid: 'QmRs6U5YirCqC7taTynz3x2GNaHJZ3jDvMVAzaiXppwmNJ',
          size: 32538395
        }
      ]

      const node = await dagPB.deserialize(buf)
      const nodeJSON = node.toJSON()
      expect(nodeJSON.links).to.eql(expectedLinks)

      const cid = await dagPB.cid(buf, { version: 0 })
      expect(cid.toBaseEncodedString()).to.eql(
        'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX')
    })

    it('deserialize go-ipfs block with named links', async () => {
      const buf = testBlockNamedLinks

      const expectedLinks = [
        {
          name: 'audio_only.m4a',
          cid: 'QmaUAwAQJNtvUdJB42qNbTTgDpzPYD1qdsKNtctM5i7DGB',
          size: 23319629
        },
        {
          name: 'chat.txt',
          cid: 'QmNVrxbB25cKTRuKg2DuhUmBVEK9NmCwWEHtsHPV6YutHw',
          size: 996
        },
        {
          name: 'playback.m3u',
          cid: 'QmUcjKzDLXBPmB6BKHeKSh6ZoFZjss4XDhMRdLYRVuvVfu',
          size: 116
        },
        {
          name: 'zoom_0.mp4',
          cid: 'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX',
          size: 306281879
        }
      ]

      const node = await dagPB.deserialize(buf)
      const nodeJSON = node.toJSON()
      expect(nodeJSON.links).to.eql(expectedLinks)

      const cid = await dagPB.cid(buf, { version: 0 })
      expect(cid.toBaseEncodedString()).to.eql(
        'QmbSAC58x1tsuPBAoarwGuTQAgghKvdbKSBC8yp5gKCj5M')
    })

    it('dagNode.toJSON with empty Node', async () => {
      const node = await DAGNode.create(Buffer.alloc(0))
      expect(node.toJSON().data).to.eql(Buffer.alloc(0))
      expect(node.toJSON().links).to.eql([])
      expect(node.toJSON().size).to.exist()
    })

    it('dagNode.toJSON with data no links', async () => {
      const data = Buffer.from('La cucaracha')
      const node = await DAGNode.create(data)
      expect(node.toJSON().data).to.eql(data)
      expect(node.toJSON().links).to.eql([])
      expect(node.toJSON().size).to.exist()
    })

    it('add two nameless links to a node', async () => {
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

      const link1 = new DAGLink(l1.Name, l1.Size,
        Buffer.from(bs58.decode(l1.Hash)))
      const link2 = new DAGLink(l2.Name, l2.Size,
        Buffer.from(bs58.decode(l2.Hash)))

      const node = await DAGNode.create(Buffer.from('hiya'), [link1, link2])
      expect(node.links).to.have.lengthOf(2)
    })

    it('toString', async () => {
      const node = await DAGNode.create(Buffer.from('hello world'))
      const expected = 'DAGNode <data: "aGVsbG8gd29ybGQ=", links: 0, size: 13>'
      expect(node.toString()).to.equal(expected)
    })

    it('deserializing a node and an object should yield the same result', async () => {
      const obj = {
        data: Buffer.from('Hello World'),
        links: [{
          cid: new CID('QmUxD5gZfKzm8UN4WaguAMAZjw2TzZ2ZUmcqm2qXPtais7'),
          name: 'payload',
          size: 819
        }]
      }

      const node = await DAGNode.create(obj.data, obj.links)
      expect(node.data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.data)).to.be.true()
      expect(node.size).to.be.above(0)

      const serialized = await dagPB.serialize(node)
      const serializedObject = await dagPB.serialize(obj)
      const deserialized = await dagPB.deserialize(serialized)
      const deserializedObject = await dagPB.deserialize(serializedObject)
      expect(deserialized.toJSON()).to.deep.equal(deserializedObject.toJSON())
    })
  })
}
