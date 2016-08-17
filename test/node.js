/* eslint-env mocha */
'use strict'

const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const Store = require('fs-pull-blob-store')

describe('Node.js Tests', () => {
  const repoExample = process.cwd() + '/test/example-repo'
  const repoTests = process.cwd() + '/test/repo-just-for-test' + Date.now()

  before((done) => {
    ncp(repoExample, repoTests, (err) => {
      process.env.IPFS_PATH = repoTests
      done(err)
    })
  })

  after((done) => {
    rimraf(repoTests, done)
  })

  const repo = new IPFSRepo(repoTests, {stores: Store})

  require('./dag-service-test')(repo)
  require('./dag-node-test')(repo)
  require('./dag-link-test')(repo)
})
