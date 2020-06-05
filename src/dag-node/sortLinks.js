'use strict'

const { Buffer } = require('buffer')
const sort = require('stable')

const linkSort = (a, b) => {
  return Buffer.compare(a.nameAsBuffer, b.nameAsBuffer)
}

/**
 * Returns new sorted links array.
 * @param {Array} links
 * @returns {Array}
 */
const sortLinks = (links) => {
  return sort(links, linkSort)
}

/**
 * Sorts links in place (mutating given array)
 * @param {Array} links
 * @returns {void}
 */
const sortLinksInPlace = (links) => {
  sort.inplace(links, linkSort)
}

sortLinks.inplace = sortLinksInPlace

module.exports = sortLinks
