/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const mh = require('multihashes')
const DAGLink = require('../src/dag-link')

module.exports = function (repo) {
  describe('DAGLink', function () {
    describe('hash', () => {
      it('string', () => {
        const link = new DAGLink('hello', 3, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')

        expect(
          link.hash.toString('hex')
        ).to.be.equal(
          '12208ab7a6c5e74737878ac73863cb76739d15d4666de44e5756bf55a2f9e9ab5f43'
        )
      })

      it('Buffer', () => {
        const link = new DAGLink('hello', 3, new Buffer('12208ab7a6c5e74737878ac73863cb76739d15d4666de44e5756bf55a2f9e9ab5f43', 'hex'))

        expect(
          mh.toB58String(link.hash)
        ).to.be.equal(
          'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
        )
      })

      it('missing', () => {
        const link = new DAGLink('hello', 3)

        expect(link.hash).to.not.exist
      })
    })

    it('toJSON', () => {
      const link = new DAGLink('hello', 3, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')

      expect(
        link.toJSON()
      ).to.be.eql({
        Name: 'hello',
        Size: 3,
        Hash: 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'
      })
    })

    it('toString', () => {
      const link = new DAGLink('hello', 3, 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')

      expect(
        link.toString()
      ).to.be.equal(
        'DAGLink <QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U - name: "hello", size: 3>'
      )
    })
  })
}
