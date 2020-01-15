'use strict'

const withIs = require('class-is')
const sortLinks = require('./sortLinks')
const DAGLink = require('../dag-link/dagLink')
const { serializeDAGNode } = require('../serialize.js')
const toDAGLink = require('./toDagLink')
const addLink = require('./addLink')
const rmLink = require('./rmLink')

class DAGNode {
  constructor (data, links = []) {
    if (!data) {
      data = Buffer.alloc(0)
    }
    if (typeof data === 'string') {
      data = Buffer.from(data)
    }
    if (!Buffer.isBuffer(data)) {
      throw new Error('Passed \'data\' is not a buffer or a string!')
    }

    links = links.map((link) => {
      return DAGLink.isDAGLink(link)
        ? link
        : DAGLink.util.createDagLinkFromB58EncodedHash(link)
    })
    links = sortLinks(links)

    this._data = data
    this._links = links
  }

  toJSON () {
    if (!this._json) {
      this._json = Object.freeze({
        data: this.Data,
        links: this._links.map((l) => l.toJSON())
      })
    }

    return Object.assign({}, this._json)
  }

  toString () {
    return `DAGNode <data: "${this.Data.toString('base64')}", links: ${this.Links.length}>`
  }

  addLink (link) {
    return addLink(this, link)
  }

  rmLink (link) {
    return rmLink(this, link)
  }

  // @returns {Promise.<DAGLink>}
  toDAGLink (options) {
    return toDAGLink(this, options)
  }

  serialize () {
    return serializeDAGNode({
      Data: this._data,
      Links: this._links
    })
  }

  // Getters for backwards compatible path resolving
  get Data () {
    return this._data
  }

  set Data (_) {
    throw new Error("Can't set property: 'Data' is immutable")
  }

  get Links () {
    return this._links.map((link) => {
      return {
        Name: link.Name,
        Hash: link.Hash
      }
    })
  }

  set Links (_) {
    throw new Error("Can't set property: 'Links' is immutable")
  }
}

exports = module.exports = withIs(DAGNode, { className: 'DAGNode', symbolName: '@ipld/js-ipld-dag-pb/dagnode' })
