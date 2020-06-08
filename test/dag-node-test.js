/* eslint-env mocha */
'use strict'

const chai = require('aegir/utils/chai')
const { Buffer } = require('buffer')
const expect = chai.expect

const dagPB = require('../src')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const { isNode } = require('ipfs-utils/src/env')
const multihash = require('multihashes')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')

const BlockService = require('ipfs-block-service')
const Block = require('ipld-block')
const CID = require('cids')
const multibase = require('multibase')
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
      expect(node.size).to.be.above(0)

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

      const node1 = new DAGNode(someData, l1)
      const l2 = l1.map((l) => {
        return new DAGLink(l.Name, l.Tsize, l.Hash)
      })

      const node2 = new DAGNode(someData, l2)
      expect(node2.Links).to.containSubset([l1[1], l1[0]])
      expect(node1.toJSON()).to.eql(node2.toJSON())

      // check sorting
      expect(node1.Links.map((l) => l.Name)).to.be.eql([
        'some link',
        'some other link'
      ])
    })

    it('create a node with sorted links', () => {
      const links = [{
        Name: '',
        Hash: new CID('QmUGhP2X8xo9dsj45vqx1H6i5WqPqLqmLQsHTTxd3ke8mp'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmP7SrR76KHK9A916RbHG1ufy2TzNABZgiE23PjZDMzZXy'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmQg1v4o9xdT3Q14wh4S7dxZkDjyZ9ssFzFzyep1YrVJBY'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmdP6fartWRrydZCUjHgrJ4XpxSE4SAoRsWJZ1zJ4MWiuf'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmNNjUStxtMC1WaSZYiDW6CmAUrvd5Q2e17qnxPgVdwrwW'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmWJwqZBJWerHsN1b7g4pRDYmzGNnaMYuD3KSbnpaxsB2h'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmRXPSdysBS3dbUXe6w8oXevZWHdPQWaR2d3fggNsjvieL'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmTUZAXfws6zrhEksnMqLxsbhXZBQs4FNiarjXSYQqVrjC'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmNNk7dTdh8UofwgqLNauq6N78DPc6LKK2yBs1MFdx7Mbg'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmW5mrJfyqh7B4ywSvraZgnWjS3q9CLiYURiJpCX3aro5i'),
        Tsize: 262158
      }, {
        Name: '',
        Hash: new CID('QmTFHZL5CkgNz19MdPnSuyLAi6AVq9fFp81zmPpaL2amED'),
        Tsize: 262158
      }]

      const node = new DAGNode(Buffer.from('some data'), links)
      const serialized = node.serialize()
      const deserialized = dagPB.util.deserialize(serialized)

      // check sorting
      expect(deserialized.Links.map((l) => l.Hash)).to.be.eql(links.map(l => l.Hash))
    })

    it('create with empty link name', () => {
      const node = new DAGNode(Buffer.from('hello'), [
        new DAGLink('', 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ])
      expect(node.Links[0].Name).to.be.eql('')
    })

    it('create with undefined link name', () => {
      const node = new DAGNode(Buffer.from('hello'), [
        new DAGLink(undefined, 10, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
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

    it('create an empty node', () => {
      // this node is not in the repo as we don't copy node data to the browser
      const node = new DAGNode(Buffer.alloc(0))
      expect(node.Data.length).to.be.equal(0)
      expect(Buffer.isBuffer(node.Data)).to.be.true()
      expect(node.size).to.be.equal(0)

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
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by DAGLink', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink()
      node1.addLink(link)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by object', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink()
      const linkObject = link.toJSON()
      node1.addLink(linkObject)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
      expect(node1.Links[0].Name).to.be.eql('')
    })

    it('addLink by name', async () => {
      const node1 = new DAGNode(Buffer.from('1'))
      const node2 = new DAGNode(Buffer.from('2'))
      const link = await node2.toDAGLink({ name: 'banana' })
      expect(node1.Links.length).to.equal(0)
      node1.addLink(link)
      expect(node1.Links.length).to.equal(1)
      expect(node1.Links[0].Tsize).to.eql(node2.size)
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
      expect(target.Links[0].Tsize).to.eql(remote.size)
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

    it('node size updates with mutation', async () => {
      // see pbcross.go for the source of the sizes and CIDs here

      async function cid (node) {
        const serialized = dagPB.util.serialize(node)
        const cid = await dagPB.util.cid(serialized, { cidVersion: 0 })
        return cid.toBaseEncodedString()
      }

      async function rawBlockCid (str) {
        const raw = Buffer.from(str)
        const rawHash = await multihashing(raw, 'sha2-256')
        return new CID(1, 'raw', rawHash)
      }

      // raw nodes
      const rnd1 = await rawBlockCid('aaaa')
      const rnd2 = await rawBlockCid('bbbb')
      const rnd3 = await rawBlockCid('cccc')

      // empty PB nodes
      const pnd1 = new DAGNode()
      const pnd2 = new DAGNode()
      const pnd3 = new DAGNode()

      // sanity check empty nodes
      for (const node of [pnd1, pnd2, pnd3]) {
        expect(node.size).to.equal(0)
        expect(await cid(node)).to.equal('QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n')
      }

      // named PB links to a raw nodes
      const cat = new DAGLink('cat', 4, rnd1)
      const dog = new DAGLink('dog', 4, rnd2)
      const bear = new DAGLink('bear', 4, rnd3)

      // pnd1
      // links by constructor and addLink should yield the same node
      const pnd1ByConstructor = new DAGNode(null, [cat])
      expect(pnd1ByConstructor.size).to.equal(51)
      expect(await cid(pnd1ByConstructor)).to.equal('QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT')

      pnd1.addLink(cat)
      expect(pnd1.size).to.equal(51)
      expect(await cid(pnd1)).to.equal('QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT')

      // pnd2
      const pnd1Link = await pnd1.toDAGLink({ name: 'first', cidVersion: 0 })
      const pnd2ByConstructor = new DAGNode(null, [pnd1Link, dog])
      expect(pnd2ByConstructor.size).to.equal(149)
      expect(await cid(pnd2ByConstructor)).to.equal('QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys')

      pnd2.addLink(pnd1Link)
      pnd2.addLink(dog)
      expect(pnd2.size).to.equal(149)
      expect(await cid(pnd2)).to.equal('QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys')

      // pnd3
      const pnd2Link = await pnd2.toDAGLink({ name: 'second', cidVersion: 0 })
      const pnd3ByConstructor = new DAGNode(null, [pnd2Link, bear])
      expect(pnd3ByConstructor.size).to.equal(250)
      expect(await cid(pnd3ByConstructor)).to.equal('QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d')

      pnd3.addLink(pnd2Link)
      pnd3.addLink(bear)
      expect(pnd3.size).to.equal(250)
      expect(await cid(pnd3)).to.equal('QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d')
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
      const node = new DAGNode(Buffer.alloc(0))
      expect(node.toJSON().data).to.eql(Buffer.alloc(0))
      expect(node.toJSON().links).to.eql([])
      expect(node.toJSON().size).to.exist()
    })

    it('dagNode.toJSON with data no links', () => {
      const data = Buffer.from('La cucaracha')
      const node = new DAGNode(data)
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
      const link1 = new DAGLink(
        l1.Name,
        l1.Tsize,
        multibase.decode('z' + l1.Hash)
      )
      const link2 = new DAGLink(
        l2.Name,
        l2.Tsize,
        multibase.decode('z' + l2.Hash)
      )

      const node = new DAGNode(Buffer.from('hiya'), [link1, link2])
      expect(node.Links).to.have.lengthOf(2)
    })

    it('toString', () => {
      const node = new DAGNode(Buffer.from('hello world'))
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

      const node = new DAGNode(obj.Data, obj.Links)
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
      const node = new DAGNode(Buffer.from('some data'), [{
        Hash: 'QmUxD5gZfKzm8UN4WaguAMAZjw2TzZ2ZUmcqm2qXPtais7',
        Size: 9001
      }])

      expect(node.Links[0].Tsize).to.eql(9001)
    })
  })
}
