/* eslint-env mocha */

'use strict'

const chai = require('aegir/utils/chai')
const expect = chai.expect
const CID = require('cids')

const { DAGNode, resolver } = require('../src')
const utils = require('../src/util')
const uint8ArrayFromString = require('uint8arrays/from-string')

/**
 * @typedef {import('../src/dag-link/dagLink')} DAGLink
 * @typedef {import('../src/dag-link/dagLink').DAGLinkLike} DAGLinkLike
 */

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

  /**
   * @param {Uint8Array} data
   * @param {(DAGLink | DAGLinkLike)[]} links
   */
  const create = (data, links) => {
    const node = new DAGNode(data, links)
    return utils.serialize(node)
  }

  /**
   * @param {Uint8Array} data
   * @param {(DAGLink | DAGLinkLike)[]} links
   */
  const createPlain = (data, links) => {
    const node = {
      Data: data,
      Links: links
    }
    return utils.serialize(node)
  }

  const emptyNodeBlobs = [
    { kind: 'DAGNode', blob: create(new Uint8Array(), []) },
    { kind: '{data:Uint8Array}', blob: createPlain(new Uint8Array(), []) }
  ]

  const linksNodeBlobs = [
    { kind: 'DAGNode', blob: create(new Uint8Array(), links) },
    { kind: '{data:Uint8Array}', blob: createPlain(new Uint8Array(), links) }
  ]

  const dataLinksNodeBlobs = [
    { kind: 'DAGNode', blob: create(uint8ArrayFromString('aaah the data'), links) },
    { kind: '{data:Uint8Array}', blob: createPlain(uint8ArrayFromString('aaah the data'), links) }
  ]

  for (const { kind, blob } of emptyNodeBlobs) {
    describe(`empty node (${kind})`, () => {
      describe('resolver.resolve', () => {
        it('links path', () => {
          const result = resolver.resolve(blob, 'Links')
          expect(result).to.have.deep.property('value', [])
          expect(result).to.have.property('remainderPath', '')
        })

        it('data path', () => {
          const result = resolver.resolve(blob, 'Data')
          expect(result).to.have.property('value').that.is.an.instanceOf(Uint8Array).with.lengthOf(0)
          expect(result).to.have.property('remainderPath', '')
        })

        it('non existent path', () => {
          expect(() =>
            resolver.resolve(blob, 'pathThatDoesNotExist')
          ).to.throw(
            "Object has no property 'pathThatDoesNotExist'"
          )
        })

        it('empty path', () => {
          const result = resolver.resolve(blob, '')
          expect(result).to.have.nested.property('value.Data').that.is.an.instanceOf(Uint8Array).with.lengthOf(0)
          expect(result).to.have.deep.nested.property('value.Links', [])
          expect(result).to.have.property('remainderPath', '')
        })
      })

      it('resolver.tree', () => {
        const tree = resolver.tree(blob)
        const paths = [...tree]
        expect(paths).to.have.members([
          'Links',
          'Data'
        ])
      })
    })
  }

  for (const { kind, blob } of linksNodeBlobs) {
    describe(`links node ${kind}`, () => {
      describe('resolver.resolve', () => {
        it('links path', () => {
          const result = resolver.resolve(blob, 'Links')
          expect(result).to.have.property('value').that.containSubset(links)
          expect(result).to.have.property('remainderPath', '')
        })

        it('links position path Hash', () => {
          const result = resolver.resolve(blob, 'Links/1/Hash')
          expect(result).to.have.deep.property('value', links[1].Hash)
          expect(result).to.have.property('remainderPath', '')
        })

        it('links position path Name', () => {
          const result = resolver.resolve(blob, 'Links/1/Name')
          expect(result).to.have.property('value', links[1].Name)
          expect(result).to.have.property('remainderPath', '')
        })

        it('links position path Tsize', () => {
          const result = resolver.resolve(blob, 'Links/1/Tsize')
          expect(result).to.have.property('value', links[1].Tsize)
          expect(result).to.have.property('remainderPath', '')
        })

        it('links by name', () => {
          const result = resolver.resolve(blob, 'named link')
          expect(result).to.have.deep.property('value', links[1].Hash)
          expect(result).to.have.property('remainderPath', '')
        })

        it('missing link by name', () => {
          expect(() =>
            resolver.resolve(blob, 'missing link')
          ).to.throw(
            "Object has no property 'missing link'"
          )
        })

        it('yield remainderPath if impossible to resolve through (a)', () => {
          const result = resolver.resolve(blob, 'Links/1/Hash/Data')
          expect(result).to.have.deep.property('value', new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'))
          expect(result).to.have.property('remainderPath', 'Data')
        })

        it('yield remainderPath if impossible to resolve through (b)', () => {
          const result = resolver.resolve(blob, 'Links/1/Hash/Links/0/Hash/Data')
          expect(result).to.have.deep.property('value', new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'))
          expect(result).to.have.property('remainderPath', 'Links/0/Hash/Data')
        })

        it('yield remainderPath if impossible to resolve through named link (a)', () => {
          const result = resolver.resolve(blob, 'named link/Data')
          expect(result).to.have.deep.property('value', new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'))
          expect(result).to.have.property('remainderPath', 'Data')
        })

        it('yield remainderPath if impossible to resolve through named link (b)', () => {
          const result = resolver.resolve(blob, 'named link/Links/0/Hash/Data')
          expect(result).to.have.deep.property('value', new CID('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'))
          expect(result).to.have.property('remainderPath', 'Links/0/Hash/Data')
        })
      })

      it('resolver.tree', () => {
        const tree = resolver.tree(blob)
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

  for (const { kind, blob } of dataLinksNodeBlobs) {
    describe(`links and data node (${kind})`, () => {
      describe('resolver.resolve', () => {
        it('links path', () => {
          const result = resolver.resolve(blob, 'Links')
          expect(result.value).to.containSubset(links)
          expect(result.remainderPath).to.eql('')
        })

        it('data path', () => {
          const result = resolver.resolve(blob, 'Data')
          expect(result.value).to.eql(uint8ArrayFromString('aaah the data'))
          expect(result.remainderPath).to.eql('')
        })

        it('non existent path', () => {
          expect(() =>
            resolver.resolve(blob, 'pathThatDoesNotExist')
          ).to.throw(
            "Object has no property 'pathThatDoesNotExist'"
          )
        })

        it('empty path', () => {
          const result = resolver.resolve(blob, '')
          expect(result).to.have.deep.nested.property('value.Data', uint8ArrayFromString('aaah the data'))
          expect(result).to.have.nested.property('value.Links').that.containSubset(links)
          expect(result.remainderPath).to.eql('')
        })
      })

      it('resolver.tree', () => {
        const tree = resolver.tree(blob)
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
