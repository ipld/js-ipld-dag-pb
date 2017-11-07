/* eslint-env mocha */
'use strict'

const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const series = require('async/series')
const os = require('os')

describe('Node.js', () => {
  const repoExample = process.cwd() + '/test/test-repo'
  const repoTests = os.tmpdir() + '/t-r-' + Date.now()
  const repo = new IPFSRepo(repoTests)

  before((done) => {
    series([
      (cb) => ncp(repoExample, repoTests, cb),
      (cb) => repo.open(cb)
    ], done)
  })

  after((done) => {
    series([
      (cb) => repo.close(cb),
      (cb) => rimraf(repoTests, cb)
    ], done)
  })

  require('./dag-link-test')(repo)
  require('./dag-node-test')(repo)
})
