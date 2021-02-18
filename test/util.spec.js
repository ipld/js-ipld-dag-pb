/* eslint-env mocha */

'use strict'

const CID = require('cids')
const chai = require('aegir/utils/chai')
const expect = chai.expect
const {
  multihash
} = require('multihashing-async')

const {
  DAGLink
} = require('../src')
const {
  serialize,
  deserialize,
  cid
} = require('../src/util')

describe('util', () => {
  it('should serialize an empty node', () => {
    const result = serialize({})
    expect(result).to.be.an.instanceof(Uint8Array)
    expect(result).to.be.empty()
  })

  it('should serialize a node with data', () => {
    const data = Uint8Array.from([0, 1, 2, 3])
    const result = serialize({ Data: data })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Data).to.deep.equal(data)
  })

  it('should serialize a node with Uint8Array data', () => {
    const data = Uint8Array.from([0, 1, 2, 3])
    const result = serialize({ Data: data })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Data).to.deep.equal(Uint8Array.from([0, 1, 2, 3]))
  })

  it('should serialize a node with links', () => {
    const links = [
      new DAGLink('', 0, 'QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    ]
    const result = serialize({ Links: links })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Links).to.containSubset([{
      Name: '',
      Tsize: 0,
      Hash: new CID('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }])
  })

  it('should serialize a node with links as plain objects', () => {
    const links = [{
      Name: '',
      Tsize: 0,
      Hash: new CID('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }]
    const result = serialize({ Links: links })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Links).to.containSubset(links)
  })

  it('should ignore invalid properties when serializing', () => {
    // @ts-ignore invalid properties
    const result = serialize({ foo: 'bar' })
    expect(result).to.be.empty()
  })

  describe('cid', () => {
    it('should allow the identity hash', async () => {
      const buffer = serialize({ Data: new Uint8Array(0), Links: [] })
      const id = await cid(buffer, {
        hashAlg: multihash.names.identity
      })

      const result = multihash.decode(id.multihash)

      expect(result).to.have.property('name', 'identity')
    })
  })
})
