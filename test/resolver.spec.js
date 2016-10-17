/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */

'use strict'

const expect = require('chai').expect
const dagPB = require('../src')
// const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const util = dagPB.util
const resolver = dagPB.resolver

const Block = require('ipfs-block')

describe('IPLD format resolver (local)', () => {
  let emptyNodeBlock
  let linksNodeBlock
  let dataLinksNodeBlock

  const links = [{
    Name: '',
    Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
    Size: 10
  }, {
    Name: 'named link',
    Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
    Size: 8
  }]

  before(() => {
    // create a bunch of nodes serialized into Blocks
    //    const d1 = new DAGNode(new Buffer('some data'), l1)
    const emptyNode = new DAGNode(new Buffer(0))

    const linksNode = new DAGNode(new Buffer(0), links)
    const dataLinksNode = new DAGNode(new Buffer('aaah the data'), links)

    emptyNodeBlock = new Block(util.serialize(emptyNode))
    linksNodeBlock = new Block(util.serialize(linksNode))
    dataLinksNodeBlock = new Block(util.serialize(dataLinksNode))
  })

  it('multicodec is dag-pb', () => {
    expect(resolver.multicodec).to.equal('dag-pb')
  })

  describe('empty node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        const result = resolver.resolve(emptyNodeBlock, 'links')
        expect(result.value).to.eql([])
        expect(result.remainderPath).to.eql('')
      })

      it('data path', () => {
        const result = resolver.resolve(emptyNodeBlock, 'data')
        expect(result.value).to.eql(new Buffer(0))
        expect(result.remainderPath).to.eql('')
      })

      it('non existent path', () => {
        expect(() => {
          resolver.resolve(emptyNodeBlock, 'pathThatDoesNotExist')
        }).to.throw
      })
    })

    it('resolver.tree', () => {
      const paths = resolver.tree(emptyNodeBlock)
      expect(paths).to.eql([])
    })

    it.skip('resolver.patch', (done) => {})
  })

  describe('links node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        const result = resolver.resolve(linksNodeBlock, 'links')
        expect(result.value).to.eql(links)
        expect(result.remainderPath).to.eql('')
      })

      it('links position path', () => {
        const result = resolver.resolve(linksNodeBlock, 'links/1')
        expect(result.value).to.eql(links[1].Hash)
        expect(result.remainderPath).to.eql('')
      })

      it('yield remainderPath if impossible to resolve through (a)', () => {
        const result = resolver.resolve(linksNodeBlock, 'links/1/data')
        expect(result.value['/']).to.exist
        expect(result.value['/']).to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
        expect(result.remainderPath).to.equal('data')
      })

      it('yield remainderPath if impossible to resolve through (b)', () => {
        const result = resolver.resolve(linksNodeBlock, 'links/1/links/0/data')
        expect(result.value['/']).to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')

        expect(result.remainderPath).to.equal('links/0/data')
      })
    })

    it('resolver.tree', () => {
      const paths = resolver.tree(linksNodeBlock)
      expect(paths).to.eql([{
        path: '',
        value: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
      }, {
        path: 'named link',
        value: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'
      }])
    })

    it.skip('resolver.patch', () => {})
  })

  describe('links and data node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        const result = resolver.resolve(dataLinksNodeBlock, 'links')
        expect(result.value).to.eql(links)
        expect(result.remainderPath).to.eql('')
      })

      it('data path', () => {
        const result = resolver.resolve(dataLinksNodeBlock, 'data')
        expect(result.value).to.eql(new Buffer('aaah the data'))
        expect(result.remainderPath).to.eql('')
      })

      it('non existent path', () => {
        expect(() => {
          resolver.resolve(dataLinksNodeBlock, 'pathThatDoesNotExist')
        }).to.throw
      })
    })

    it('resolver.tree', () => {
      const paths = resolver.tree(dataLinksNodeBlock)
      expect(paths).to.eql([{
        path: '',
        value: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
      }, {
        path: 'named link',
        value: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'
      }, {
        path: 'data',
        value: new Buffer('aaah the data')
      }])
    })

    it.skip('resolver.patch', () => {})
  })
})
