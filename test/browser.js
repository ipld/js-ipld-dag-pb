/* eslint-env mocha */
'use strict'

const series = require('run-series')
const store = require('idb-plus-blob-store')
const _ = require('lodash')
const IPFSRepo = require('ipfs-repo')
const repoContext = require.context('buffer!./example-repo', true)

const idb = window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB

idb.deleteDatabase('ipfs')
idb.deleteDatabase('ipfs/blocks')

describe('Browser tests', function () {
  before(function (done) {
    this.timeout(10000)

    const repoData = []
    repoContext.keys().forEach(function (key) {
      repoData.push({
        key: key.replace('./', ''),
        value: repoContext(key)
      })
    })

    const mainBlob = store('ipfs')
    const blocksBlob = store('ipfs/blocks')

    series(repoData.map((file) => (cb) => {
      if (_.startsWith(file.key, 'datastore/')) {
        return cb()
      }

      const blocks = _.startsWith(file.key, 'blocks/')
      const blob = blocks ? blocksBlob : mainBlob
      const key = blocks ? file.key.replace(/^blocks\//, '') : file.key

      blob.createWriteStream({
        key: key
      }).end(file.value, cb)
    }), done)
  })

  const repo = new IPFSRepo('ipfs', {stores: store})

  require('./dag-service-test')(repo)
  require('./dag-node-test')(repo)
  require('./dag-link-test')(repo)
})
