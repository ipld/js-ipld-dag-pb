'use strict'

const dagNodeUtil = require('./util')
const cloneLinks = dagNodeUtil.cloneLinks
const cloneData = dagNodeUtil.cloneData
const toDAGLink = dagNodeUtil.toDAGLink
const DAGLink = require('../dag-link')
const DAGNode = require('./index')
const create = require('./create')

function asDAGLink (link, callback) {
  if (DAGLink.isDAGLink(link)) {
    // It's a DAGLink instance
    // no need to do anything

    return callback(null, link)
  }

  if (DAGNode.isDAGNode(link)) {
    // It's a DAGNode instance
    // convert to link
    return toDAGLink(link, {}, callback)
  }

  // It's a Object with name, multihash/hash/cid and size
  try {
    callback(null, new DAGLink(link.name, link.size, link.multihash || link.hash || link.cid))
  } catch (err) {
    return callback(err)
  }
}

function addLink (node, link, callback) {
  const links = cloneLinks(node)
  const data = cloneData(node)

  asDAGLink(link, (error, link) => {
    if (error) {
      return callback(error)
    }

    links.push(link)
    create(data, links, callback)
  })
}

module.exports = addLink
