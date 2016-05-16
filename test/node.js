/* eslint-env mocha */
'use strict'

const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const expect = require('chai').expect
const IPFSRepo = require('ipfs-repo')
const store = require('fs-blob-store')

describe('Node.js Tests', () => {
  const repoExample = process.cwd() + '/test/example-repo'
  const repoTests = process.cwd() + '/test/repo-just-for-test' + Date.now()

  before((done) => {
    ncp(repoExample, repoTests, (err) => {
      process.env.IPFS_PATH = repoTests
      expect(err).to.equal(null)
      done()
    })
  })

  after((done) => {
    rimraf(repoTests, (err) => {
      expect(err).to.equal(null)
      done()
    })
  })

  const repo = new IPFSRepo(repoTests, {stores: store})

  require('./dag-service-test')(repo)
  require('./dag-node-test')(repo)
  require('./dag-link-test')(repo)
})
