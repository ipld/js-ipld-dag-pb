/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const dagPB = require('../src')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const toDAGLink = require('../src/dag-node/util').toDAGLink
const isNode = require('detect-node')
const multihash = require('multihashes')
const multicodec = require('multicodec')
const promisify = require('promisify-es6')

const BlockService = require('ipfs-block-service')
const Block = require('ipfs-block')
const CID = require('cids')
const bs58 = require('bs58')
const loadFixture = require('aegir/fixtures')

const testBlockNamedLinks = loadFixture('test/fixtures/test-block-named-links')
const testBlockUnnamedLinks = loadFixture('test/fixtures/test-block-unnamed-links')

module.exports = (repo) => {
  const _bs = new BlockService(repo)
  const bs = {
    get: promisify(_bs.get.bind(_bs)),
    put: promisify(_bs.put.bind(_bs))
  }

  describe('DAGNode', () => {
    it('create a node', () => {
      const data = Buffer.from('some data')

      const node = DAGNode.create(data)
      expect(node.Data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()
      expect(node.size).to.be.above(0)

      const serialized = dagPB.util.serialize(node)
      const deserialized = dagPB.util.deserialize(serialized)
      expect(node.Data).to.eql(deserialized.Data)
    })

    it('create a node with string data', () => {
      const data = 'some data'

      const node = DAGNode.create(data)
      expect(node.Data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()
      expect(node.size).to.be.above(0)

      const serialized = dagPB.util.serialize(node)

      const deserialized = dagPB.util.deserialize(serialized)
      expect(node.Data).to.eql(deserialized.Data)
    })

    it('create a node with links', () => {
      const l1 = [{
        Name: 'some other link',
        Hash: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'),
        Tsize: 8
      }, {
        Name: 'some link',
        Hash: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'),
        Tsize: 10
      }]

      const someData = Buffer.from('some data')

      const node1 = DAGNode.create(someData, l1)
      const l2 = l1.map((l) => {
        return new DAGLink(l.Name, l.Tsize, l.Hash)
      })

      const node2 = DAGNode.create(someData, l2)
      expect(node2.Links).to.eql([l1[1], l1[0]])
      expect(node1.toJSON()).to.eql(node2.toJSON())

      // check sorting
      expect(node1.Links.map((l) => l.Name)).to.be.eql([
        'some link',
        'some other link'
      ])
    })

    it('create with empty link name', () => {
      const node = DAGNode.create(Buffer.from('hello'), [
        new DAGLink('', 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ])
      expect(node.Links[0].Name).to.be.eql('')
    })

    it('create with undefined link name', () => {
      const node = DAGNode.create(Buffer.from('hello'), [
        new DAGLink(undefined, 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ])
      expect(node.Links[0].Name).to.be.eql('')
      const serialized = dagPB.util.serialize(node)
      const deserialized = dagPB.util.deserialize(serialized)
      for (const key of Object.keys(node)) {
        expect(node[key]).to.deep.equal(deserialized[key])
      }
    })

    it('create an empty node', () => {
      // this node is not in the repo as we don't copy node data to the browser
      const node = DAGNode.create(Buffer.alloc(0))
      expect(node.Data.length).to.be.equal(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()
      expect(node.size).to.be.equal(0)

      const serialized = dagPB.util.serialize(node)
      const deserialized = dagPB.util.deserialize(serialized)
      expect(node.Data).to.eql(deserialized.Data)
    })

    it('fail to create a node with other data types', () => {
      expect(() => DAGNode.create({})).to.throw(
        'Passed \'data\' is not a buffer or a string!'
      )
      expect(() => DAGNode.create([])).to.throw(
        'Passed \'data\' is not a buffer or a string!'
      )
    })

    it('addLink by DAGNode', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      const node2 = DAGNode.create(Buffer.from('2'))
      await DAGNode.addLink(node1, node2)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by DAGLink', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      const node2 = DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2)
      await DAGNode.addLink(node1, link)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by object', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      const node2 = DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2)
      const linkObject = link.toJSON()
      await DAGNode.addLink(node1, linkObject)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by name', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      const node2 = DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2, { name: 'banana' })
      expect(Object.keys(node1)).to.not.include('banana')
      await DAGNode.addLink(node1, link)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.eql('banana')
      expect(Object.keys(node1)).to.include('banana')
    })

    it('addLink - add several links', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      expect(node1.Links.length).to.equal(0)

      const node2 = DAGNode.create(Buffer.from('2'))
      await DAGNode.addLink(node1, node2)
      expect(node1.Links.length).to.equal(1)

      const node3 = DAGNode.create(Buffer.from('3'))
      await DAGNode.addLink(node1, node3)
      expect(node1.Links.length).to.equal(2)
    })

    it('addLink by DAGNode.Links', async () => {
      const linkName = 'link-name'
      const remote = DAGNode.create(Buffer.from('2'))
      const source = DAGNode.create(Buffer.from('1'))
      await DAGNode.addLink(
        source,
        await toDAGLink(remote, {
          name: linkName
        })
      )

      expect(source.Links.length).to.equal(1)

      const target = new DAGNode(null, [], 0)
      await DAGNode.addLink(target, source.Links[0])

      expect(target.Links.length).to.equal(1)
      expect(target.Links[0].Tsize).to.eql(remote.size)
      expect(target.Links[0].Name).to.be.eql(linkName)
    })

    it('rmLink by name', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      expect(node1.Links.length).to.eql(0)
      const withoutLink = node1.toJSON()

      const node2 = DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2, { name: 'banana' })

      await DAGNode.addLink(node1, link)
      expect(node1.Links.length).to.eql(1)
      expect(Object.keys(node1)).to.include('banana')
      DAGNode.rmLink(node1, 'banana')
      expect(Object.keys(node1)).to.not.include('banana')
      expect(node1.Links.length).to.eql(0)
      expect(node1.toJSON()).to.eql(withoutLink)
    })

    it('rmLink by hash', async () => {
      const node1 = DAGNode.create(Buffer.from('1'))
      expect(node1.Links.length).to.eql(0)
      const withoutLink = node1.toJSON()

      const node2 = DAGNode.create(Buffer.from('2'))
      const link = await toDAGLink(node2, { name: 'banana' })

      await DAGNode.addLink(node1, link)
      expect(node1.Links.length).to.eql(1)
      expect(Object.keys(node1)).to.include('banana')
      DAGNode.rmLink(node1, node1.Links[0].Hash)
      expect(Object.keys(node1)).to.not.include('banana')
      expect(node1.Links.length).to.eql(0)
      expect(node1.toJSON()).to.eql(withoutLink)
    })

    it('get node CID', async () => {
      const node = DAGNode.create(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized)
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(1)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-256')
    })

    it('get node CID with version', async () => {
      const node = DAGNode.create(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized, { cidVersion: 0 })
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(0)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-256')
    })

    it('get node CID with hashAlg', async () => {
      const node = DAGNode.create(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized, { hashAlg: multicodec.SHA2_512 })
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(1)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-512')
    })

    it('marshal a node and store it with block-service', async () => {
      const node = DAGNode.create(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized)
      const block = new Block(Buffer.from(serialized), cid)

      await bs.put(block)
      const retrievedBlock = await bs.get(block.cid)
      expect(retrievedBlock).to.eql(block)
    })

    it('deserialize go-ipfs block from ipldResolver', async () => {
      if (!isNode) {
        return
      }

      const cidStr = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
      const cid = new CID(cidStr)

      const block = await bs.get(cid)
      const node = dagPB.util.deserialize(block.data)
      expect(node.Data).to.exist()
      expect(node.Links.length).to.equal(6)
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

      const node = dagPB.util.deserialize(buf)
      const nodeJSON = node.toJSON()
      expect(nodeJSON.links).to.eql(expectedLinks)

      const cid = await dagPB.util.cid(buf, { cidVersion: 0 })
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

      const node = dagPB.util.deserialize(buf)
      const nodeJSON = node.toJSON()
      expect(nodeJSON.links).to.eql(expectedLinks)

      const cid = await dagPB.util.cid(buf, { cidVersion: 0 })
      expect(cid.toBaseEncodedString()).to.eql(
        'QmbSAC58x1tsuPBAoarwGuTQAgghKvdbKSBC8yp5gKCj5M')
    })

    it('dagNode.toJSON with empty Node', () => {
      const node = DAGNode.create(Buffer.alloc(0))
      expect(node.toJSON().data).to.eql(Buffer.alloc(0))
      expect(node.toJSON().links).to.eql([])
      expect(node.toJSON().size).to.exist()
    })

    it('dagNode.toJSON with data no links', () => {
      const data = Buffer.from('La cucaracha')
      const node = DAGNode.create(data)
      expect(node.toJSON().data).to.eql(data)
      expect(node.toJSON().links).to.eql([])
      expect(node.toJSON().size).to.exist()
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

      const link1 = new DAGLink(l1.Name, l1.Tsize,
        Buffer.from(bs58.decode(l1.Hash)))
      const link2 = new DAGLink(l2.Name, l2.Tsize,
        Buffer.from(bs58.decode(l2.Hash)))

      const node = DAGNode.create(Buffer.from('hiya'), [link1, link2])
      expect(node.Links).to.have.lengthOf(2)
    })

    it('toString', () => {
      const node = DAGNode.create(Buffer.from('hello world'))
      const expected = 'DAGNode <data: "aGVsbG8gd29ybGQ=", links: 0, size: 13>'
      expect(node.toString()).to.equal(expected)
    })

    it('deserializing a node and an object should yield the same result', () => {
      const obj = {
        Data: Buffer.from('Hello World'),
        Links: [{
          Hash: new CID('QmUxD5gZfKzm8UN4WaguAMAZjw2TzZ2ZUmcqm2qXPtais7'),
          Name: 'payload',
          Tsize: 819
        }]
      }

      const node = DAGNode.create(obj.Data, obj.Links)
      expect(node.Data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()
      expect(node.size).to.be.above(0)

      const serialized = dagPB.util.serialize(node)
      const serializedObject = dagPB.util.serialize(obj)
      const deserialized = dagPB.util.deserialize(serialized)
      const deserializedObject = dagPB.util.deserialize(serializedObject)
      expect(deserialized.toJSON()).to.deep.equal(deserializedObject.toJSON())
    })

    it('creates links from objects with .Size properties', () => {
      const node = DAGNode.create(Buffer.from('some data'), [{
        Hash: 'QmUxD5gZfKzm8UN4WaguAMAZjw2TzZ2ZUmcqm2qXPtais7',
        Size: 9001
      }])

      expect(node.Links[0].Tsize).to.eql(9001)
    })
  })
}
