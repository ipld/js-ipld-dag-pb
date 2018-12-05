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
} = require('../src/ipld-format')

describe('IPLD Format implementation', () => {
  it('should serialize an empty node', async () => {
    const result = await serialize({})
    expect(result).to.be.an.instanceof(Uint8Array)
    expect(result).to.be.empty()
  })

  it('should serialize a node with data', async () => {
    const data = Buffer.from([0, 1, 2, 3])
    const result = await serialize({ data })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = await deserialize(result)
    expect(node.data).to.deep.equal(data)
  })

  it('should serialize a node with links', async () => {
    const links = [
      new DAGLink('', 0, 'QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    ]
    const result = await serialize({ links })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = await deserialize(result)
    expect(node.links).to.deep.equal([{
      name: '',
      size: 0,
      cid: new CID('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }])
  })

  it('should serialize a node with links as plain objects', async () => {
    const links = [{
      name: '',
      size: 0,
      cid: new CID('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }]
    const result = await serialize({ links })
    expect(result).to.be.an.instanceof(Uint8Array)

    const node = await deserialize(result)
    expect(node.links).to.deep.equal(links)
  })

  it('should ignore invalid properties when serializing', async () => {
    const result = await serialize({ foo: 'bar' })
    expect(result).to.be.empty()
  })
})
