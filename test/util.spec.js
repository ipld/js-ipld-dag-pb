/* eslint-env mocha */

'use strict'

const CID = require('cids')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const {
  DAGLink
} = require('../src')
const {
  serialize,
  deserialize
} = require('../src/util')

describe('util', () => {
  it('should serialize an empty node', () => {
    const result = serialize({})
    expect(result).to.be.an.instanceof(Uint8Array)
    expect(result).to.be.empty()
  })

  it('should serialize a node with data', () => {
    const data = Buffer.from([0, 1, 2, 3])
    const result = serialize({ Data: data })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Data).to.deep.equal(data)
  })

  it('should serialize a node with links', () => {
    const links = [
      new DAGLink('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    ]
    const result = serialize({ Links: links })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Links).to.deep.equal([{
      Name: '',
      Hash: new CID('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }])
  })

  it('should serialize a node with links as plain objects', () => {
    const links = [{
      Name: '',
      Hash: new CID('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }]
    const result = serialize({ Links: links })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = deserialize(result)
    expect(node.Links).to.deep.equal(links)
  })

  it('should ignore invalid properties when serializing', () => {
    const result = serialize({ foo: 'bar' })
    expect(result).to.be.empty()
  })
})
