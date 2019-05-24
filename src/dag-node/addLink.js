'use strict'

const dagNodeUtil = require('./util')
const cloneLinks = dagNodeUtil.cloneLinks
const cloneData = dagNodeUtil.cloneData
const toDAGLink = dagNodeUtil.toDAGLink
const DAGLink = require('../dag-link')
const DAGNode = require('./index')
const create = require('./create')

// NOTE vmx 2019-05-27: The `async` is intentionally there to make it more
// explicit that this function might return a promise
// eslint-disable-next-line require-await
const asDAGLink = async (link) => {
  if (DAGLink.isDAGLink(link)) {
    // It's a DAGLink instance
    // no need to do anything
    return link
  }

  if (DAGNode.isDAGNode(link)) {
    // It's a DAGNode instance
    // convert to link
    return toDAGLink(link, {})
  }

  // It's a Object with name, multihash/hash/cid and size
  return new DAGLink(link.Name || link.name, link.Tsize || link.size, link.Hash || link.multihash || link.hash || link.cid)
}

const addLink = async (node, link) => {
  const links = cloneLinks(node)
  const data = cloneData(node)

  const dagLink = await asDAGLink(link)
  links.push(dagLink)
  return create(data, links)
}

module.exports = addLink
