/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
// const DAGLink = require('../src').DAGLink
const DAGNode = require('../src').DAGNode
const resolver = require('../src').resolver

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

    // TODO we need to hint block with its CID,
    // so it knows how to hash it
    emptyNodeBlock = new Block(emptyNode.serialize())
    linksNodeBlock = new Block(linksNode.serialize())
    dataLinksNodeBlock = new Block(dataLinksNode.serialize())
  })

  it('multicodec is dag-pb', () => {
    expect(resolver.multicodec).to.equal('dag-pb')
  })

  describe('empty node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        const links = resolver.resolve(emptyNodeBlock, 'links')
        expect(links).to.eql([])
      })

      it('data path', () => {
        const data = resolver.resolve(emptyNodeBlock, 'data')
        expect(data).to.eql(new Buffer(0))
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
        const links = resolver.resolve(linksNodeBlock, 'links')
        expect(links).to.eql(links)
      })

      it('links position path', () => {
        const link = resolver.resolve(linksNodeBlock, 'links/1')
        expect(link).to.eql(links[1])
      })
    })

    it('resolver.tree', () => {
      const paths = resolver.tree(linksNodeBlock)
      expect(paths).to.eql([{
        'path': '',
        'value': 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
      }, {
        'path': 'named link',
        'value': 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'
      }])
    })

    it.skip('resolver.patch', () => {})
  })

  describe('links and data node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        const links = resolver.resolve(dataLinksNodeBlock, 'links')
        expect(links).to.eql(links)
      })

      it('data path', () => {
        const data = resolver.resolve(dataLinksNodeBlock, 'data')
        expect(data).to.eql(new Buffer('aaah the data'))
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
        'path': '',
        'value': 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
      }, {
        'path': 'named link',
        'value': 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'
      }, {
        'path': 'data',
        'value': new Buffer('aaah the data')
      }])
    })

    it.skip('resolver.patch', () => {})
  })
})
