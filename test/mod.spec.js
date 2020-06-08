/* eslint-env mocha */
'use strict'

const chai = require('aegir/utils/chai')
const expect = chai.expect
const multicodec = require('multicodec')

const mod = require('../src')

describe('IPLD Format)', () => {
  it('codec is dag-pb', () => {
    expect(mod.codec).to.equal(multicodec.DAG_PB)
  })

  it('defaultHashAlg is sha2-256', () => {
    expect(mod.defaultHashAlg).to.equal(multicodec.SHA2_256)
  })
})
