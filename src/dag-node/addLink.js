'use strict'

const sortLinks = require('./sortLinks')
const DAGLink = require('../dag-link')
const DAGNode = require('./index')

const asDAGLink = (link) => {
  if (DAGLink.isDAGLink(link)) {
    // It's a DAGLink instance
    // no need to do anything
    return link
  }

  if (DAGNode.isDAGNode(link)) {
    throw new Error('Link must be a DAGLink or DAGLink-like. Convert the DAGNode into a DAGLink via `node.toDAGLink()`.')
  }

  // It's a Object with name, multihash/hash/cid and size
  return new DAGLink(link.Name || link.name, link.Tsize || link.size, link.Hash || link.multihash || link.hash || link.cid)
}

const addLink = (node, link) => {
  const dagLink = asDAGLink(link)
  node._links.push(dagLink)
  node._links = sortLinks(node._links)
}

module.exports = addLink
