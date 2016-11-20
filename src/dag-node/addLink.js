'use strict'

const dagNodeUtil = require('./util')
const cloneLinks = dagNodeUtil.cloneLinks
const cloneData = dagNodeUtil.cloneData
const toDAGLink = dagNodeUtil.toDAGLink
const DAGLink = require('./../dag-link')
const create = require('./create')

function addLink (dagNode, nameOrLink, nodeOrMultihash, callback) {
  const links = cloneLinks(dagNode)
  const data = cloneData(dagNode)
  let newLink = null

  if ((nameOrLink.constructor &&
       nameOrLink.constructor.name === 'DAGLink')) {
    // It's a link
    newLink = nameOrLink
    // It's a name
    if ((nodeOrMultihash.constructor &&
       nodeOrMultihash.constructor.name === 'DAGNode')) {
      // It's a node
      newLink = toDAGLink(nodeOrMultihash)
    } else {
      // It's a multihash
      newLink = new DAGLink(null, dagNode.size, nodeOrMultihash)
    }
  }

  if (newLink) {
    links.push(newLink)
  } else {
    return callback(new Error('Link given as the argument is invalid'), null)
  }

  create(data, links, callback)
}

module.exports = addLink
