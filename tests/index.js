const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const test = require('tape')

exports = module.exports

function setUp (next) {
  const testRepoPath = __dirname + '/example-repo'
  const date = Date.now().toString()
  const repoPath = testRepoPath + date
  exports.repoPath = repoPath

  ncp(testRepoPath, repoPath, err => {
    if (err) { throw err }
    console.log('# set up complete')
    next()
  })
}

function tests () {
  require('./node-test.js')
  require('./block-test.js')
  require('./blockservice-test.js')
  test.onFinish(tearDown)
}

function tearDown () {
  rimraf(exports.repoPath, err => {
    if (err) { throw err }
    console.log('# tear down complete')
  })
}

setUp(tests)
