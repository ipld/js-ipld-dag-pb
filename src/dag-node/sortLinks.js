'use strict'

const { Buffer } = require('buffer')

const linkSort = (a, b) => {
  return Buffer.compare(a.nameAsBuffer, b.nameAsBuffer)
}

/**
 *
 * @param {Array} links
 * @returns {Array}
 */
const sortLinks = (links) => {
  return links.sort(linkSort)
}

module.exports = sortLinks
