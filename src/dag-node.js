'use strict'

const stable = require('stable')
const mh = require('multihashes')
const DAGLink = require('./dag-link')

class DAGNode {
  constructor (data, links) {
    this._cached = undefined
    this._updated = false

    this.data = data
    this.links = []

    // validate links
    if (links) {
      links.forEach((l) => {
        if (l.constructor && l.constructor.name === 'DAGLink') {
          this.links.push(l)
        } else {
          this.links.push(
            new DAGLink(l.Name, l.Size, l.Hash)
          )
        }
      })

      stable.inplace(this.links, util.linkSort)
    }
  }

  /*
   * addNodeLink - adds a DAGLink to this node that points
   * to node by a name
   */
  addNodeLink (name, node) {
    if (typeof name !== 'string') {
      throw new Error('first argument must be link name')
    }
    const link = this.makeLink(node)

    link.name = name
    this.addRawLink(link)
  }

  /*
   * addRawLink adds a Link to this node from a DAGLink
   */
  addRawLink (link) {
    this._updated = true
    this.links.push(new DAGLink(link.name, link.size, link.hash))
    stable.inplace(this.links, util.linkSort)
  }

  /*
   * UpdateNodeLink return a copy of the node with the link name
   * set to point to that. If a link of the same name existed,
   * it is replaced.
   */
  // TODO ?? this would make more sense as an utility
  updateNodeLink (name, node) {
    const newnode = this.copy()
    newnode.removeNodeLink(name)
    newnode.addNodeLink(name, node)
    return newnode
  }

  /*
   * removeNodeLink removes a Link from this node based on name
   */
  removeNodeLink (name) {
    this._updated = true

    this.links = this.links.filter((link) => {
      if (link.name === name) {
        return false
      } else {
        return true
      }
    })
  }

  /*
   * removeNodeLink removes a Link from this node based on a multihash
   */
  removeNodeLinkByHash (multihash) {
    this._updated = true

    this.links = this.links.filter((link) => {
      if (link.hash.equals(multihash)) {
        return false
      } else {
        return true
      }
    })
  }

  /*
   * makeLink returns a DAGLink node from a DAGNode
   */
  // TODO: this would make more sense as an utility
  makeLink (node) {
    return new DAGLink(null, node.size(), node.multihash())
  }

  /*
   * clone - returns a clone of the DAGNode
   */
  clone () {
    const clone = new DAGNode()
    if (this.data && this.data.length > 0) {
      const buf = new Buffer(this.data.length)
      this.data.copy(buf)
      clone.data = buf
    }

    if (this.links.length > 0) {
      clone.links = this.links.slice()
    }

    return clone
  }

  /*
   * multihash - returns the multihash value of this DAGNode
   */
  multihash () {
    if (!this.cached || this._updated) {
      this._cached = util.hash(util.serialize(this))
      this._updated = false
    }

    return this._cached
  }

  /*
   * size - returns the total size of the data addressed by node,
   * including the total sizes of references.
   */
  size () {
    const buf = util.serialize(this)
    if (!buf) {
      return 0
    }

    return this.links.reduce((sum, l) => {
      return sum + l.size
    }, buf.length)
  }

  toJSON () {
    return {
      Data: this.data,
      Links: this.links.map((l) => l.toJSON()),
      Hash: mh.toB58String(this.multihash()),
      Size: this.size()
    }
  }

  toString () {
    const hash = mh.toB58String(this.multihash())
    return `DAGNode <${hash} - data: "${this.data.toString()}", links: ${this.links.length}, size: ${this.size()}>`
  }
}

module.exports = DAGNode
const util = require('./util')
