/* eslint-env mocha */
'use strict'

const fs = require('fs-extra')
const IPFSRepo = require('ipfs-repo')
const os = require('os')

describe('Node.js', () => {
  const repoExample = process.cwd() + '/test/test-repo'
  const repoTests = os.tmpdir() + '/t-r-' + Date.now()
  const repo = new IPFSRepo(repoTests)

  before(async () => {
    await fs.copy(repoExample, repoTests)
    await repo.open()
  })

  after(async () => {
    await repo.close()
    await fs.remove(repoTests)
  })

  require('./dag-link-test')(repo)
  require('./dag-node-test')(repo)
})
