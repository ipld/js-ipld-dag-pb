/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const parallel = require('async/parallel')
const CID = require('cids')
const Block = require('ipfs-block')
const waterfall = require('async/waterfall')

const dagPB = require('../src')
const DAGNode = dagPB.DAGNode
const resolver = dagPB.resolver

describe('IPLD Format resolver (local)', () => {
  let emptyNodeBlock
  let linksNodeBlock
  let dataLinksNodeBlock

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
      cb(null, new Block(n.serialized, new CID(n.multihash)))
    }
  ], callback)

  before((done) => {
    parallel([
      (cb) => create(Buffer.alloc(0), [], cb),
      (cb) => create(Buffer.alloc(0), links, cb),
      (cb) => create(Buffer.from('aaah the data'), links, cb)
    ], (err, res) => {
      expect(err).to.not.exist()
      emptyNodeBlock = res[0]
      linksNodeBlock = res[1]
      dataLinksNodeBlock = res[2]
      done()
    })
  })

  it('multicodec is dag-pb', () => {
    expect(resolver.multicodec).to.equal('dag-pb')
  })

  describe('empty node', () => {
    describe('resolver.resolve', () => {
      it('links path', (done) => {
        resolver.resolve(emptyNodeBlock, 'Links', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql([])
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('data path', (done) => {
        resolver.resolve(emptyNodeBlock, 'Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(Buffer.alloc(0))
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('non existent path', (done) => {
        resolver.resolve(emptyNodeBlock, 'pathThatDoesNotExist', (err, result) => {
          expect(err).to.exist()
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(emptyNodeBlock, (err, paths) => {
        expect(err).to.not.exist()
        expect(paths).to.eql([
          'Links',
          'Data'
        ])
        done()
      })
    })
  })

  describe('links node', () => {
    describe('resolver.resolve', () => {
      it('links path', (done) => {
        resolver.resolve(linksNodeBlock, 'Links', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(links)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links position path Hash', (done) => {
        resolver.resolve(linksNodeBlock, 'Links/1/Hash', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.eql(links[1].multihash)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links position path Name', (done) => {
        resolver.resolve(linksNodeBlock, 'Links/1/Name', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.eql(links[1].name)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links position path Tsize', (done) => {
        resolver.resolve(linksNodeBlock, 'Links/1/Tsize', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.eql(links[1].size)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('yield remainderPath if impossible to resolve through (a)', (done) => {
        resolver.resolve(linksNodeBlock, 'Links/1/Hash/Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.exist()
          expect(result.value['/']).to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          expect(result.remainderPath).to.equal('Data')
          done()
        })
      })

      it('yield remainderPath if impossible to resolve through (b)', (done) => {
        resolver.resolve(linksNodeBlock, 'Links/1/Hash/Links/0/Hash/Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/'])
            .to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')

          expect(result.remainderPath).to.equal('Links/0/Hash/Data')
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(linksNodeBlock, (err, paths) => {
        expect(err).to.not.exist()
        expect(paths).to.eql([
          'Links',
          'Links/0/Name',
          'Links/0/Tsize',
          'Links/0/Hash',
          'Links/1/Name',
          'Links/1/Tsize',
          'Links/1/Hash',
          'Data'
        ])
        done()
      })
    })
  })

  describe('links and data node', () => {
    describe('resolver.resolve', (done) => {
      it('links path', (done) => {
        resolver.resolve(dataLinksNodeBlock, 'Links', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(links)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('data path', (done) => {
        resolver.resolve(dataLinksNodeBlock, 'Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(Buffer.from('aaah the data'))
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('non existent path', (done) => {
        resolver.resolve(dataLinksNodeBlock, 'pathThatDoesNotExist', (err, result) => {
          expect(err).to.exist()
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(dataLinksNodeBlock, (err, paths) => {
        expect(err).to.not.exist()
        expect(paths).to.eql([
          'Links',
          'Links/0/Name',
          'Links/0/Tsize',
          'Links/0/Hash',
          'Links/1/Name',
          'Links/1/Tsize',
          'Links/1/Hash',
          'Data'
        ])
        done()
      })
    })
  })

  it('resolver.isLink for valid CID', (done) => {
    resolver.isLink(dataLinksNodeBlock, 'Links/0/Hash', (err, link) => {
      expect(err).to.not.exist()
      expect(CID.isCID(new CID(link['/']))).to.equal(true)
      done()
    })
  })

  it('resolver.isLink for non valid CID', (done) => {
    resolver.isLink(dataLinksNodeBlock, 'Links/0/Name', (err, link) => {
      expect(err).to.not.exist()
      expect(link).to.equal(false)
      done()
    })
  })
})
