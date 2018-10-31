'use strict'

const DAGLink = require('./index.js')

function create (name, size, cid, callback) {
  const link = new DAGLink(name, size, cid)
  callback(null, link)
}

module.exports = create
