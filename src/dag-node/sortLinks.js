'use strict'

const sort = require('stable')
const { Buffer } = require('buffer')

const linkSort = (a, b) => {
  return Buffer.compare(a.nameAsBuffer, b.nameAsBuffer)
}

const sortLinks = (links) => {
  return sort(links, linkSort)
}

module.exports = sortLinks
