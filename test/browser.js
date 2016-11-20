/* eslint-env mocha */
'use strict'

const series = require('async/series')
const Store = require('idb-pull-blob-store')
const _ = require('lodash')
const IPFSRepo = require('ipfs-repo')
const repoContext = require.context('buffer!./test-repo', true)
const pull = require('pull-stream')

const idb = window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB

idb.deleteDatabase('ipfs')
idb.deleteDatabase('ipfs/blocks')

describe('Browser tests', () => {
  const path = 'ipfs' + Math.random()

  before((done) => {
    const repoData = []

    repoContext.keys().forEach((key) => {
      repoData.push({
        key: key.replace('./', ''),
        value: repoContext(key)
      })
    })

    const mainBlob = new Store(path)
    const blocksBlob = new Store(path + '/blocks')

    series(repoData.map((file) => (cb) => {
      if (_.startsWith(file.key, 'datastore/')) {
        return cb()
      }

      const blocks = _.startsWith(file.key, 'blocks/')
      const blob = blocks ? blocksBlob : mainBlob
      const key = blocks ? file.key.replace(/^blocks\//, '') : file.key

      pull(
        pull(
          pull.values([file.value]),
          blob.write(key, cb)
        )
      )
    }), done)
  })

  const repo = new IPFSRepo(path, {stores: Store})

  require('./dag-node-test')(repo)
  require('./dag-link-test')(repo)
})
