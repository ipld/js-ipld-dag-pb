/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const CID = require('cids')
const isPlainObject = require('is-plain-object')

const dagPB = require('../src')
const ipldFormat = require('../src/ipld-format')
const DAGNode = dagPB.DAGNode

const buildTree = (object) => {
  const result = []
  const actualBuildTree = (object, prefix) => {
    for (const [key, value] of Object.entries(object)) {
      const fullkey = prefix + key
      result.push(fullkey)
      if (isPlainObject(value) || Array.isArray(value)) {
        actualBuildTree(value, fullkey + '/')
      }
    }
  }
  actualBuildTree(object, '')
  return result
}

describe('IPLD Format resolver (local)', async () => {
  const links = [{
    name: '',
    cid: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'),
    size: 10
  }, {
    name: 'named link',
    cid: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'),
    size: 8
  }]

  // If traversing the capital letter version of the properties, they should
  // return Go compatible links
  const goStyleLinks = links.map((link) => {
    return {
      Name: link.name,
      Tsize: link.size,
      Hash: link.cid
    }
  })

  let emptyNode
  let linksNode
  let dataLinksNode

  before(async () => {
    emptyNode = await DAGNode.create(Buffer.alloc(0), [])
    linksNode = await DAGNode.create(Buffer.alloc(0), links)
    dataLinksNode = await DAGNode.create(Buffer.from('aaah the data'), links)
  })

  it('multicodec is dag-pb', () => {
    // TODO vmx 2018-12-06: Use the multicodec table so that it's a constant
    // and not a magic number
    expect(ipldFormat.format).to.equal(0x70)
  })

  it('defaultHashAlg is sha2-256', () => {
    // TODO vmx 2018-12-06: Use the multicodec table so that it's a constant
    // and not a magic number
    expect(ipldFormat.defaultHashAlg).to.equal(0x12)
  })

  describe('empty node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        expect(emptyNode.Links).to.eql([])
      })

      it('data path', () => {
        expect(emptyNode.Data).to.eql(Buffer.alloc(0))
      })

      it('non existent path', () => {
        expect(emptyNode.pathThatDoesNotExist).to.be.undefined()
      })
    })

    it('resolver.tree', () => {
      const paths = Object.keys(emptyNode)
      expect(paths).to.have.same.members([
        'links',
        'data',
        'Links',
        'Data'
      ])
    })
  })

  describe('links node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        expect(linksNode.Links).to.eql(goStyleLinks)
      })

      it('links position path Hash', () => {
        expect(linksNode.Links[1].Hash).to.eql(links[1].cid)
      })

      it('links position path Name', () => {
        expect(linksNode.Links[1].Name).to.eql(links[1].name)
      })

      it('links position path Tsize', () => {
        expect(linksNode.Links[1].Tsize).to.eql(links[1].size)
      })

      it('links by name', () => {
        expect(linksNode['named link'].cid).to.eql(links[1].cid)
      })

      it('missing link by name', () => {
        expect(linksNode['missing link']).to.be.undefined()
      })
    })

    it('resolver.tree', () => {
      const paths = buildTree(linksNode)
      expect(paths).to.have.same.members([
        'data',
        'Data',
        'links',
        'links/0',
        'links/0/name',
        'links/0/size',
        'links/0/cid',
        'links/1',
        'links/1/name',
        'links/1/size',
        'links/1/cid',
        'Links',
        'Links/0',
        'Links/0/Name',
        'Links/0/Tsize',
        'Links/0/Hash',
        'Links/1',
        'Links/1/Name',
        'Links/1/Tsize',
        'Links/1/Hash',
        'named link'
      ])
    })
  })

  describe('links and data node', () => {
    describe('resolver.resolve', () => {
      it('links path', () => {
        expect(dataLinksNode.Links).to.eql(goStyleLinks)
      })

      it('data path', () => {
        expect(dataLinksNode.Data).to.eql(Buffer.from('aaah the data'))
      })

      it('non existent path', () => {
        expect(dataLinksNode.pathThatDoesNotExist).to.be.undefined()
      })
    })

    it('resolver.tree', () => {
      const paths = buildTree(dataLinksNode)
      expect(paths).to.have.same.members([
        'data',
        'Data',
        'links',
        'links/0',
        'links/0/name',
        'links/0/size',
        'links/0/cid',
        'links/1',
        'links/1/name',
        'links/1/size',
        'links/1/cid',
        'Links',
        'Links/0',
        'Links/0/Name',
        'Links/0/Tsize',
        'Links/0/Hash',
        'Links/1',
        'Links/1/Name',
        'Links/1/Tsize',
        'Links/1/Hash',
        'named link'
      ])
    })
  })
})
