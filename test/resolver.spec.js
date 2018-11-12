/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const parallel = require('async/parallel')
const CID = require('cids')
const waterfall = require('async/waterfall')

const dagPB = require('../src')
const DAGNode = dagPB.DAGNode
const resolver = dagPB.resolver
const utils = require('../src/util')

describe('IPLD Format resolver (local)', () => {
  let emptyNodeBlob
  let linksNodeBlob
  let dataLinksNodeBlob

  const links = [{
    name: '',
    cid: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
    multihash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U',
    size: 10
  }, {
    name: 'named link',
    cid: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
    multihash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V',
    size: 8
  }]
  const create = (data, links, callback) => waterfall([
    (cb) => DAGNode.create(data, links, cb),
    (n, cb) => utils.serialize(n, cb)
  ], callback)

  before((done) => {
    parallel([
      (cb) => create(Buffer.alloc(0), [], cb),
      (cb) => create(Buffer.alloc(0), links, cb),
      (cb) => create(Buffer.from('aaah the data'), links, cb)
    ], (err, res) => {
      expect(err).to.not.exist()
      emptyNodeBlob = res[0]
      linksNodeBlob = res[1]
      dataLinksNodeBlob = res[2]
      done()
    })
  })

  it('multicodec is dag-pb', () => {
    expect(resolver.multicodec).to.equal('dag-pb')
  })

  it('defaultHashAlg is sha2-256', () => {
    expect(resolver.defaultHashAlg).to.equal('sha2-256')
  })

  describe('empty node', () => {
    describe('resolver.resolve', () => {
      it('links path', (done) => {
        resolver.resolve(emptyNodeBlob, 'Links', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql([])
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('data path', (done) => {
        resolver.resolve(emptyNodeBlob, 'Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(Buffer.alloc(0))
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('non existent path', (done) => {
        resolver.resolve(emptyNodeBlob, 'pathThatDoesNotExist', (err, result) => {
          expect(err).to.exist()
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
        resolver.resolve(linksNodeBlob, 'Links', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(links)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links position path Hash', (done) => {
        resolver.resolve(linksNodeBlob, 'Links/1/Hash', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.eql(links[1].cid)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links position path Name', (done) => {
        resolver.resolve(linksNodeBlob, 'Links/1/Name', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(links[1].name)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links position path Tsize', (done) => {
        resolver.resolve(linksNodeBlob, 'Links/1/Tsize', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(links[1].size)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('links by name', (done) => {
        resolver.resolve(linksNodeBlob, 'named link', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.eql(links[1].cid)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('missing link by name', (done) => {
        resolver.resolve(linksNodeBlob, 'missing link', (err, result) => {
          expect(err).to.exist()
          expect(err.message).to.equal('path not available')
          done()
        })
      })

      it('yield remainderPath if impossible to resolve through (a)', (done) => {
        resolver.resolve(linksNodeBlob, 'Links/1/Hash/Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.exist()
          expect(result.value['/']).to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          expect(result.remainderPath).to.equal('Data')
          done()
        })
      })

      it('yield remainderPath if impossible to resolve through (b)', (done) => {
        resolver.resolve(linksNodeBlob, 'Links/1/Hash/Links/0/Hash/Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/'])
            .to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')

          expect(result.remainderPath).to.equal('Links/0/Hash/Data')
          done()
        })
      })

      it('yield remainderPath if impossible to resolve through named link (a)', (done) => {
        resolver.resolve(linksNodeBlob, 'named link/Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/']).to.exist()
          expect(result.value['/']).to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')
          expect(result.remainderPath).to.equal('Data')
          done()
        })
      })

      it('yield remainderPath if impossible to resolve through named link (b)', (done) => {
        resolver.resolve(linksNodeBlob, 'named link/Links/0/Hash/Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value['/'])
            .to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V')

          expect(result.remainderPath).to.equal('Links/0/Hash/Data')
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(linksNodeBlob, (err, paths) => {
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
        resolver.resolve(dataLinksNodeBlob, 'Links', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(links)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('data path', (done) => {
        resolver.resolve(dataLinksNodeBlob, 'Data', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value).to.eql(Buffer.from('aaah the data'))
          expect(result.remainderPath).to.eql('')
          done()
        })
      })

      it('non existent path', (done) => {
        resolver.resolve(dataLinksNodeBlob, 'pathThatDoesNotExist', (err, result) => {
          expect(err).to.exist()
          done()
        })
      })

      it('empty path', (done) => {
        resolver.resolve(dataLinksNodeBlob, '', (err, result) => {
          expect(err).to.not.exist()
          expect(result.value.data).to.eql(Buffer.from('aaah the data'))
          expect(result.value.links.map((link) => link.toJSON())).to.eql(links)
          expect(result.remainderPath).to.eql('')
          done()
        })
      })
    })

    it('resolver.tree', (done) => {
      resolver.tree(dataLinksNodeBlob, (err, paths) => {
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
    resolver.isLink(dataLinksNodeBlob, 'Links/0/Hash', (err, link) => {
      expect(err).to.not.exist()
      expect(CID.isCID(new CID(link['/']))).to.equal(true)
      done()
    })
  })

  it('resolver.isLink for non valid CID', (done) => {
    // blank value case
    resolver.isLink(dataLinksNodeBlob, 'Links/0/Name', (err, link) => {
      expect(err).to.not.exist()
      expect(link).to.equal(false)
      // non-blank value case
      resolver.isLink(dataLinksNodeBlob, 'Links/0/Tsize', (err, link) => {
        expect(err).to.not.exist()
        expect(link).to.equal(false)
        done()
      })
    })
  })
})
