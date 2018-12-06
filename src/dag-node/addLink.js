'use strict'

const sort = require('stable')
const { linkSort, toDAGLink } = require('./util')
const addNamedLink = require('./addNamedLink')
const DAGLink = require('../dag-link')
const DAGNode = require('./index')

const asDAGLink = async (link) => {
  if (DAGLink.isDAGLink(link)) {
    // It's a DAGLink instance
    // no need to do anything
    return link
  }

  if (DAGNode.isDAGNode(link)) {
    // It's a DAGNode instance
    // convert to link
    return toDAGLink(link)
  }

  // It's a Object with name, multihash/hash/cid and size
  return new DAGLink(link.name, link.size, link.multihash || link.hash || link.cid)
}

// TODO vmx 2018-12-03: Find out why the original code did cloning of the link
// and node. Why isn't the link just added to the existing node
const addLink = async (node, link) => {
  const dagLink = await asDAGLink(link)
  node._links.push(dagLink)
  node._links = sort(node._links, linkSort)

  const name = dagLink.name
  if (name !== '') {
    const position = node._links.findIndex((link) => link.name === name)
    if (position !== -1) {
      addNamedLink(node, name, position)
    }
  }
}

module.exports = addLink
