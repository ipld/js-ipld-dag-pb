'use strict'

const sort = require('stable')
const { linkSort, toDAGLink } = require('./util')
// const cloneLinks = dagNodeUtil.cloneLinks
// const cloneData = dagNodeUtil.cloneData
const DAGLink = require('../dag-link')
const DAGNode = require('./index')
// const create = require('./create')

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
//
// function addLink (node, link, callback) {
//   const links = cloneLinks(node)
//   const data = cloneData(node)
//
//   asDAGLink(link, (error, link) => {
//     if (error) {
//       return callback(error)
//     }
//
//     links.push(link)
//     create(data, links, callback)
//   })
// }



// TODO vmx 2018-12-03: Find out why the original code did cloning of the link
// and node. Why isn't the link just added to the existing node
const addLink = async (node, link) => {
  const dagLink = await asDAGLink(link)
  node.links.push(dagLink)
  node.links = sort(node.links, linkSort)
}

module.exports = addLink
