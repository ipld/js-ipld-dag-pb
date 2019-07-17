'use strict'

const sortLinks = require('./sortLinks')
const toDAGLink = require('./toDagLink')
const DAGLink = require('../dag-link')
const DAGNode = require('./index')

// Intentionally keeping the `async` to signal that it may return a promise
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
  const dagLink = await asDAGLink(link)
  node._links.push(dagLink)
  node._links = sortLinks(node._links)
}

module.exports = addLink
