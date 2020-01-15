/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const dagPB = require('../src')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const isNode = require('detect-node')
const multihash = require('multihashes')
const multicodec = require('multicodec')

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
    it('create a node', () => {
      const data = Buffer.from('some data')

      const node = new DAGNode(data)
      expect(node.Data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()

      const serialized = dagPB.util.serialize(node)
      const deserialized = dagPB.util.deserialize(serialized)
      expect(node.Data).to.eql(deserialized.Data)
    })

    it('dagPB.util.serialize same as node.serialize()', () => {
      const node = new DAGNode(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      expect(serialized).to.eql(node.serialize())
    })

    it('create a node with string data', () => {
      const data = 'some data'

      const node = new DAGNode(data)
      expect(node.Data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()

      const serialized = dagPB.util.serialize(node)

      const deserialized = dagPB.util.deserialize(serialized)
      expect(node.Data).to.eql(deserialized.Data)
    })

    it('create a node with links', () => {
      const l1 = [{
        Name: 'some other link',
        Hash: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
      }, {
        Name: 'some link',
        Hash: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      }]

      const someData = Buffer.from('some data')

      const node1 = new DAGNode(someData, l1)
      const l2 = l1.map((l) => {
        return new DAGLink(l.Hash, l.Name)
      })

      const node2 = new DAGNode(someData, l2)
      expect(node2.Links).to.eql([l1[1], l1[0]])
      expect(node1.toJSON()).to.eql(node2.toJSON())

      // check sorting
      expect(node1.Links.map((l) => l.Name)).to.be.eql([
        'some link',
        'some other link'
      ])
    })

    it('create with empty link name', () => {
      const node = new DAGNode(Buffer.from('hello'), [
        new DAGLink('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U', '')
      ])
      expect(node.Links[0].Name).to.be.eql('')
    })

    it('create with undefined link name', () => {
      const node = new DAGNode(Buffer.from('hello'), [
        new DAGLink('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U', undefined)
      ])
      expect(node.Links[0].Name).to.be.eql('')
      const serialized = node.serialize()
      const deserialized = dagPB.util.deserialize(serialized)
      for (const key of Object.keys(node)) {
        if (key === '_serializedSize') {
          continue
        }
        expect(node[key]).to.deep.equal(deserialized[key])
      }
    })

    it('create with null link name', () => {
      const node = new DAGNode(Buffer.from('hello'), [
        new DAGLink('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U', null)
      ])
      expect(node.Links[0].Name).to.be.eql('')
    })

    it('create an empty node', () => {
      // this node is not in the repo as we don't copy node data to the browser
      const node = new DAGNode(Buffer.alloc(0))
      expect(node.Data.length).to.be.equal(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()

      const serialized = dagPB.util.serialize(node)
      const deserialized = dagPB.util.deserialize(serialized)
      expect(node.Data).to.eql(deserialized.Data)
    })

    it('fail to create a node with other data types', () => {
      expect(() => new DAGNode({})).to.throw(
        'Passed \'data\' is not a buffer or a string!'
      )
      expect(() => new DAGNode([])).to.throw(
        'Passed \'data\' is not a buffer or a string!'
      )
    })

    it('addLink by DAGNode', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      node1.addLink(await node2.toDAGLink())
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by DAGLink', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink()
      node1.addLink(link)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by object', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink()
      const linkObject = link.toJSON()
      node1.addLink(linkObject)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by name', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink({ name: 'banana' })
      expect(node1.Links.length).to.equal(0)
      node1.addLink(link)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Name).to.eql('banana')
    })

    it('addLink - add several links', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      expect(node1.Links.length).to.equal(0)

      const node2 = new DAGNode(Buffer.from('2'))
      node1.addLink(await node2.toDAGLink())
      expect(node1.Links.length).to.equal(1)

      const node3 = new DAGNode(Buffer.from('3'))
      node1.addLink(await node3.toDAGLink())
      expect(node1.Links.length).to.equal(2)
    })

    it('addLink by DAGNode.Links', async () => {
      const linkName = 'link-name'
      const remote = new DAGNode(Buffer.from('2'))
      const source = new DAGNode(Buffer.from('1'))
      source.addLink(await remote.toDAGLink({ name: linkName }))

      expect(source.Links.length).to.equal(1)

      const target = new DAGNode(null, [], 0)
      target.addLink(source.Links[0])

      expect(target.Links.length).to.equal(1)
      expect(target.Links[0].Name).to.be.eql(linkName)
    })

    it('rmLink by name', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      expect(node1.Links.length).to.eql(0)
      const withoutLink = node1.toJSON()

      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink({ name: 'banana' })

      node1.addLink(link)
      expect(node1.Links.length).to.eql(1)
      node1.rmLink('banana')
      expect(node1.Links.length).to.eql(0)
      expect(node1.toJSON()).to.eql(withoutLink)
    })

    it('rmLink by hash', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      expect(node1.Links.length).to.eql(0)
      const withoutLink = node1.toJSON()

      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink({ name: 'banana' })

      node1.addLink(link)
      expect(node1.Links.length).to.eql(1)
      node1.rmLink(node1.Links[0].Hash)
      expect(node1.Links.length).to.eql(0)
      expect(node1.toJSON()).to.eql(withoutLink)
    })

    it('get node CID', async () => {
      const node = new DAGNode(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized)
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(1)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-256')
    })

    it('get node CID with version', async () => {
      const node = new DAGNode(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized, { cidVersion: 0 })
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(0)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-256')
    })

    it('get node CID with hashAlg', async () => {
      const node = new DAGNode(Buffer.from('some data'))
      const serialized = dagPB.util.serialize(node)
      const cid = await dagPB.util.cid(serialized, { hashAlg: multicodec.SHA2_512 })
      expect(cid.multihash).to.exist()
      expect(cid.codec).to.equal('dag-pb')
      expect(cid.version).to.equal(1)
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('sha2-512')
    })

    it('marshal a node and store it with block-service', async () => {
      const node = new DAGNode(Buffer.from('some data'))
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
          cid: 'QmSbCgdsX12C4KDw3PDmpBN9iCzS87a5DjgSCoW9esqzXk'
        },
        {
          name: '',
          cid: 'Qma4GxWNhywSvWFzPKtEswPGqeZ9mLs2Kt76JuBq9g3fi2'
        },
        {
          name: '',
          cid: 'QmQfyxyys7a1e3mpz9XsntSsTGc8VgpjPj5BF1a1CGdGNc'
        },
        {
          name: '',
          cid: 'QmSh2wTTZT4N8fuSeCFw7wterzdqbE93j1XDhfN3vQHzDV'
        },
        {
          name: '',
          cid: 'QmVXsSVjwxMsCwKRCUxEkGb4f4B98gXVy3ih3v4otvcURK'
        },
        {
          name: '',
          cid: 'QmZjhH97MEYwQXzCqSQbdjGDhXWuwW4RyikR24pNqytWLj'
        },
        {
          name: '',
          cid: 'QmRs6U5YirCqC7taTynz3x2GNaHJZ3jDvMVAzaiXppwmNJ'
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
          cid: 'QmaUAwAQJNtvUdJB42qNbTTgDpzPYD1qdsKNtctM5i7DGB'
        },
        {
          name: 'chat.txt',
          cid: 'QmNVrxbB25cKTRuKg2DuhUmBVEK9NmCwWEHtsHPV6YutHw'
        },
        {
          name: 'playback.m3u',
          cid: 'QmUcjKzDLXBPmB6BKHeKSh6ZoFZjss4XDhMRdLYRVuvVfu'
        },
        {
          name: 'zoom_0.mp4',
          cid: 'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX'
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
      const node = new DAGNode(Buffer.alloc(0))
      expect(node.toJSON().data).to.eql(Buffer.alloc(0))
      expect(node.toJSON().links).to.eql([])
    })

    it('dagNode.toJSON with data no links', () => {
      const data = Buffer.from('La cucaracha')
      const node = new DAGNode(data)
      expect(node.toJSON().data).to.eql(data)
      expect(node.toJSON().links).to.eql([])
    })

    it('add two nameless links to a node', () => {
      const l1 = {
        Name: '',
        Hash: 'QmbAmuwox51c91FmC2jEX5Ng4zS4HyVgpA5GNPBF5QsWMA'
      }

      const l2 = {
        Name: '',
        Hash: 'QmP7SrR76KHK9A916RbHG1ufy2TzNABZgiE23PjZDMzZXy'
      }

      const link1 = new DAGLink(Buffer.from(bs58.decode(l1.Hash)), l1.Name)
      const link2 = new DAGLink(Buffer.from(bs58.decode(l2.Hash)), l2.Name)

      const node = new DAGNode(Buffer.from('hiya'), [link1, link2])
      expect(node.Links).to.have.lengthOf(2)
    })

    it('toString', () => {
      const node = new DAGNode(Buffer.from('hello world'))
      const expected = 'DAGNode <data: "aGVsbG8gd29ybGQ=", links: 0>'
      expect(node.toString()).to.equal(expected)
    })

    it('deserializing a node and an object should yield the same result', () => {
      const obj = {
        Data: Buffer.from('Hello World'),
        Links: [{
          Hash: new CID('QmUxD5gZfKzm8UN4WaguAMAZjw2TzZ2ZUmcqm2qXPtais7'),
          Name: 'payload'
        }]
      }

      const node = new DAGNode(obj.Data, obj.Links)
      expect(node.Data.length).to.be.above(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()

      const serialized = dagPB.util.serialize(node)
      const serializedObject = dagPB.util.serialize(obj)
      const deserialized = dagPB.util.deserialize(serialized)
      const deserializedObject = dagPB.util.deserialize(serializedObject)
      expect(deserialized.toJSON()).to.deep.equal(deserializedObject.toJSON())
    })
  })
}
