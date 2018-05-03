/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const parallel = require('async/parallel')
const waterfall = require('async/waterfall')

const dagPB = require('../src/ipfs')
const DAGNode = dagPB.DAGNode
const resolver = dagPB.resolver

describe('IPFS IPLD Format resolver (local)', () => {
  let emptyNodeBlob
  let linksNodeBlob

  const links = [{
    name: '',
    multihash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
    size: 10
  }, {
    name: 'named link',
    multihash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
    size: 8
  }]
  const create = (data, links, callback) => waterfall([
    (cb) => DAGNode.create(data, links, cb),
    (n, cb) => {
      cb(null, n.serialized)
    }
  ], callback)

  before((done) => {
    parallel([
      (cb) => create(Buffer.alloc(0), [], cb),
      (cb) => create(Buffer.alloc(0), links, cb)
    ], (err, res) => {
      expect(err).to.not.exist()
      emptyNodeBlob = res[0]
      linksNodeBlob = res[1]
      done()
    })
  })

  it('multicodec is dag-pb', () => {
    expect(resolver.multicodec).to.equal('dag-pb')
  })

  describe('empty node', () => {
    describe('resolver.resolve', () => {
      it('non existent path', (done) => {
        resolver.resolve(emptyNodeBlob, 'pathThatDoesNotExist', (err, result) => {
          expect(err).to.exist()
          expect(err.message).to.equal('no link by that name')
          done()
        })
      })

      it('empty path', (done) => {
        resolver.resolve(emptyNodeBlob, '', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value.data).to.eql(Buffer.alloc(0))
          expect(result.value.links).to.eql([])
          expect(result.remainderPath).to.eql('')
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(emptyNodeBlob, (err, paths) => {
        expect(err).to.not.exist()
        expect(paths).to.eql([])
        done()
      })
    })
  })

  describe('links node', () => {
    describe('resolver.resolve', () => {
      it('yield remainderPath if impossible to resolve through', (done) => {
        resolver.resolve(linksNodeBlob, 'named link/rest', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.exist()
          expect(result.value['/']).to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          expect(result.remainderPath).to.equal('rest')
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(linksNodeBlob, (err, paths) => {
        expect(err).to.not.exist()
        expect(paths).to.eql([
          'named link'
        ])
        done()
      })
    })
  })
})
