/* eslint-env mocha */

'use strict'

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
  it('should serialize an empty node', (done) => {
    serialize({}, (error, result) => {
      expect(error).to.not.exist()
      expect(result).to.be.an.instanceof(Buffer)
      expect(result).to.be.empty()
      done()
    })
  })

  it('should serialize a node with data', (done) => {
    const data = Buffer.from([0, 1, 2, 3])
    serialize({
      data
    }, (error, result) => {
      expect(error).to.not.exist()
      expect(result).to.be.an.instanceof(Buffer)

      deserialize(result, (error, node) => {
        expect(error).to.not.exist()
        expect(node.data).to.deep.equal(data)

        done()
      })
    })
  })

  it('should serialize a node with links', (done) => {
    const links = [
      new DAGLink('', 0, 'QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    ]
    serialize({
      links
    }, (error, result) => {
      expect(error).to.not.exist()
      expect(result).to.be.an.instanceof(Buffer)

      deserialize(result, (error, node) => {
        expect(error).to.not.exist()
        expect(node.links).to.deep.equal(links)

        done()
      })
    })
  })

  it('should serialize a node with links as plain objects', (done) => {
    const links = [{
      name: '',
      size: 0,
      hash: 'QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe'
    }]
    serialize({
      links
    }, (error, result) => {
      expect(error).to.not.exist()
      expect(result).to.be.an.instanceof(Buffer)

      deserialize(result, (error, node) => {
        expect(error).to.not.exist()
        expect(node.links).to.deep.equal([
          new DAGLink('', 0, 'QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
        ])

        done()
      })
    })
  })

  it('should ignore invalid properties when serializing', (done) => {
    serialize({
      foo: 'bar'
    }, (error, result) => {
      expect(error).to.not.exist()
      expect(result).to.be.an.instanceof(Buffer)
      expect(result).to.be.empty()
      done()
    })
  })
})
