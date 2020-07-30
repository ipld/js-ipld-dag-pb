/* eslint-env mocha */

'use strict'

const chai = require('aegir/utils/chai')
const expect = chai.expect
const CID = require('cids')

const { DAGNode, resolver } = require('../src')
const utils = require('../src/util')
const uint8ArrayFromString = require('ipfs-utils/src/uint8arrays/from-string')

describe('IPLD Format resolver (local)', () => {
  const links = [{
    Name: '',
    Hash: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'),
    Tsize: 10
  }, {
    Name: 'named link',
    Hash: new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'),
    Tsize: 8
  }]

  const create = (data, links) => {
    const node = new DAGNode(data, links)
    return utils.serialize(node)
  }

  const createPlain = (data, links) => {
    const node = {
      Data: data,
      Links: links
    }
    return utils.serialize(node)
  }

  const emptyNodeBlobs = [
    ['DAGNode', create(new Uint8Array(), [])],
    ['{data:Uint8Array}', createPlain(new Uint8Array(), [])]
  ]

  const linksNodeBlobs = [
    ['DAGNode', create(new Uint8Array(), links)],
    ['{data:Uint8Array}', createPlain(new Uint8Array(), links)]
  ]

  const dataLinksNodeBlobs = [
    ['DAGNode', create(uint8ArrayFromString('aaah the data'), links)],
    ['{data:Uint8Array}', createPlain(uint8ArrayFromString('aaah the data'), links)]
  ]

  for (const [kind, emptyNodeBlob] of emptyNodeBlobs) {
    describe(`empty node (${kind})`, () => {
      describe('resolver.resolve', () => {
        it('links path', () => {
          const result = resolver.resolve(emptyNodeBlob, 'Links')
          expect(result.value).to.eql([])
          expect(result.remainderPath).to.eql('')
        })

        it('data path', () => {
          const result = resolver.resolve(emptyNodeBlob, 'Data')
          expect(result.value).that.is.an.instanceOf(Uint8Array).with.lengthOf(0)
          expect(result.remainderPath).to.eql('')
        })

        it('non existent path', () => {
          expect(() =>
            resolver.resolve(emptyNodeBlob, 'pathThatDoesNotExist')
          ).to.throw(
            "Object has no property 'pathThatDoesNotExist'"
          )
        })

        it('empty path', () => {
          const result = resolver.resolve(emptyNodeBlob, '')
          expect(result.value.Data).to.be.an.instanceOf(Uint8Array).with.lengthOf(0)
          expect(result.value.Links).to.eql([])
          expect(result.remainderPath).to.eql('')
        })
      })

      it('resolver.tree', () => {
        const tree = resolver.tree(emptyNodeBlob)
        const paths = [...tree]
        expect(paths).to.have.members([
          'Links',
          'Data'
        ])
      })
    })
  }

  for (const [kind, linksNodeBlob] of linksNodeBlobs) {
    describe(`links node ${kind}`, () => {
      describe('resolver.resolve', () => {
        it('links path', () => {
          const result = resolver.resolve(linksNodeBlob, 'Links')
          expect(result.value).to.containSubset(links)
          expect(result.remainderPath).to.eql('')
        })

        it('links position path Hash', () => {
          const result = resolver.resolve(linksNodeBlob, 'Links/1/Hash')
          expect(result.value).to.eql(links[1].Hash)
          expect(result.remainderPath).to.eql('')
        })

        it('links position path Name', () => {
          const result = resolver.resolve(linksNodeBlob, 'Links/1/Name')
          expect(result.value).to.eql(links[1].Name)
          expect(result.remainderPath).to.eql('')
        })

        it('links position path Tsize', () => {
          const result = resolver.resolve(linksNodeBlob, 'Links/1/Tsize')
          expect(result.value).to.eql(links[1].Tsize)
          expect(result.remainderPath).to.eql('')
        })

        it('links by name', () => {
          const result = resolver.resolve(linksNodeBlob, 'named link')
          expect(result.value.equals(links[1].Hash)).to.be.true()
          expect(result.remainderPath).to.eql('')
        })

        it('missing link by name', () => {
          expect(() =>
            resolver.resolve(linksNodeBlob, 'missing link')
          ).to.throw(
            "Object has no property 'missing link'"
          )
        })

        it('yield remainderPath if impossible to resolve through (a)', () => {
          const result = resolver.resolve(linksNodeBlob, 'Links/1/Hash/Data')
          expect(result.value.equals(
            new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          )).to.be.true()
          expect(result.remainderPath).to.equal('Data')
        })

        it('yield remainderPath if impossible to resolve through (b)', () => {
          const result = resolver.resolve(linksNodeBlob, 'Links/1/Hash/Links/0/Hash/Data')
          expect(result.value.equals(
            new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          )).to.be.true()
          expect(result.remainderPath).to.equal('Links/0/Hash/Data')
        })

        it('yield remainderPath if impossible to resolve through named link (a)', () => {
          const result = resolver.resolve(linksNodeBlob, 'named link/Data')
          expect(result.value.equals(
            new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          )).to.be.true()
          expect(result.remainderPath).to.equal('Data')
        })

        it('yield remainderPath if impossible to resolve through named link (b)', () => {
          const result = resolver.resolve(linksNodeBlob, 'named link/Links/0/Hash/Data')
          expect(result.value.equals(
            new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          )).to.be.true()
          expect(result.remainderPath).to.equal('Links/0/Hash/Data')
        })
      })

      it('resolver.tree', () => {
        const tree = resolver.tree(linksNodeBlob)
        const paths = [...tree]
        expect(paths).to.have.members([
          'Links',
          'Links/0',
          'Links/0/Name',
          'Links/0/Tsize',
          'Links/0/Hash',
          'Links/1',
          'Links/1/Name',
          'Links/1/Tsize',
          'Links/1/Hash',
          'Data'
        ])
      })
    })
  }

  for (const [kind, dataLinksNodeBlob] of dataLinksNodeBlobs) {
    describe(`links and data node (${kind})`, () => {
      describe('resolver.resolve', () => {
        it('links path', () => {
          const result = resolver.resolve(dataLinksNodeBlob, 'Links')
          expect(result.value).to.containSubset(links)
          expect(result.remainderPath).to.eql('')
        })

        it('data path', () => {
          const result = resolver.resolve(dataLinksNodeBlob, 'Data')
          expect(result.value).to.eql(uint8ArrayFromString('aaah the data'))
          expect(result.remainderPath).to.eql('')
        })

        it('non existent path', () => {
          expect(() =>
            resolver.resolve(dataLinksNodeBlob, 'pathThatDoesNotExist')
          ).to.throw(
            "Object has no property 'pathThatDoesNotExist'"
          )
        })

        it('empty path', () => {
          const result = resolver.resolve(dataLinksNodeBlob, '')
          expect(result.value.Data).to.eql(uint8ArrayFromString('aaah the data'))
          expect(result.value.Links).to.containSubset(links)
          expect(result.remainderPath).to.eql('')
        })
      })

      it('resolver.tree', () => {
        const tree = resolver.tree(dataLinksNodeBlob)
        const paths = [...tree]
        expect(paths).to.have.members([
          'Links',
          'Links/0',
          'Links/0/Name',
          'Links/0/Tsize',
          'Links/0/Hash',
          'Links/1',
          'Links/1/Name',
          'Links/1/Tsize',
          'Links/1/Hash',
          'Data'
        ])
      })
    })
  }
})
