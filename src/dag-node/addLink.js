'use strict'

const dagNodeUtil = require('./util')
const cloneLinks = dagNodeUtil.cloneLinks
const cloneData = dagNodeUtil.cloneData
const toDAGLink = dagNodeUtil.toDAGLink
const DAGLink = require('./../dag-link')
const create = require('./create')

function addLink (node, link, callback) {
  const links = cloneLinks(node)
  const data = cloneData(node)

  if ((link.constructor && link.constructor.name === 'DAGLink')) {
    // It's a DAGLink instance
    // no need to do anything
  } else if (link.constructor && link.constructor.name === 'DAGNode') {
    // It's a DAGNode instance
    // convert to link
    link = toDAGLink(link)
  } else {
    // It's a Object with name, multihash/link and size
    link.multihash = link.multihash || link.hash
    try {
      link = new DAGLink(link.name, link.size, link.multihash)
    } catch (err) {
      return callback(err)
    }
  }

  links.push(link)
  create(data, links, callback)
}

module.exports = addLink
