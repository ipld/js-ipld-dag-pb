'use strict'

const assert = require('assert')
const withIs = require('class-is')

class DAGNode {
  constructor (data, links, serializedSize) {
    if (serializedSize !== 0) {
      assert(serializedSize, 'A DAGNode requires it\'s serialized size')
    }

    this._data = data || Buffer.alloc(0)
    this._links = links || []
    this._serializedSize = serializedSize
  }

  toJSON () {
    if (!this._json) {
      this._json = Object.freeze({
        data: this.data,
        links: this.links.map((l) => l.toJSON()),
        size: this.size
      })
    }

    return Object.assign({}, this._json)
  }

  toString () {
    return `DAGNode <data: "${this.data.toString('base64')}", links: ${this.links.length}, size: ${this.size}>`
  }

  get data () {
    return this._data
  }

  set data (data) {
    throw new Error("Can't set property: 'data' is immutable")
  }

  get links () {
    return this._links
  }

  set links (links) {
    throw new Error("Can't set property: 'links' is immutable")
  }

  get size () {
    if (this._size === undefined) {
      this._size = this.links.reduce((sum, l) => sum + l.size, this._serializedSize)
    }

    return this._size
  }

  set size (size) {
    throw new Error("Can't set property: 'size' is immutable")
  }
}

exports = module.exports = withIs(DAGNode, { className: 'DAGNode', symbolName: '@ipld/js-ipld-dag-pb/dagnode' })
exports.create = require('./create')
exports.clone = require('./clone')
exports.addLink = require('./addLink')
exports.rmLink = require('./rmLink')
