'use strict'

const { Buffer } = require('buffer')
const sort = require('stable')

const linkSort = (a, b) => {
  return Buffer.compare(a.nameAsBuffer, b.nameAsBuffer)
}

/**
 * Sorts links in place (mutating given array)
 * @param {Array} links
 * @returns {void}
 */
const sortLinks = (links) => {
  sort.inplace(links, linkSort)
}

module.exports = sortLinks
