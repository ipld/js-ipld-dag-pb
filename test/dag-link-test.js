/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const mh = require('multihashes')
const DAGLink = require('../src').DAGLink

module.exports = (repo) => {
  describe('DAGLink', () => {
    describe('create with multihash as b58 encoded string', () => {
      it('string', () => {
        const link = new DAGLink('hello', 3, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')

        expect(link.multihash.toString('hex'))
          .to.equal('12208ab7a6c5e74737878ac73863cb76739d15d4666de44e5756bf55a2f9e9ab5f43')
      })

      it('empty string', () => {
        const link = new DAGLink('', 4, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
        expect(link.name).to.be.eql('')
      })

      it('create with multihash as a multihash Buffer', () => {
        const link = new DAGLink('hello', 3, new Buffer('12208ab7a6c5e74737878ac73863cb76739d15d4666de44e5756bf55a2f9e9ab5f43', 'hex'))

        expect(mh.toB58String(link.multihash))
          .to.equal('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      })

      it('fail to create without multihash', () => {
        expect(() => {
          const link = new DAGLink('hello', 3)
          expect(link).to.not.exist
        }).to.throw
      })
    })

    it('toJSON', () => {
      const link = new DAGLink('hello', 3, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')

      expect(link.toJSON()).to.eql({
        name: 'hello',
        size: 3,
        multihash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
      })
    })

    it('toString', () => {
      const link = new DAGLink('hello', 3, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')

      expect(link.toString())
        .to.equal(
        'DAGLink <QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U - name: "hello", size: 3>'
      )
    })
  })
}
