'use strict'

const assert = require('assert')
const withIs = require('class-is')
const addNamedLink = require('./addNamedLink')

/**
 * Makes all properties with a leading underscore non-enumerable.
 *
 * @param {Object} object - The object it should be applied to
 */
const hidePrivateFields = (object) => {
  for (const key in object) {
    if (key[0] === '_') {
      Object.defineProperty(object, key, { enumerable: false })
    }
  }
}

/**
 * Make certain getters enumnerable
 *
 * This can be used to add additional getters that are enumerable and hence
 * show up on an `Object.keys()` call.
 *
 * @param {Object} object - The object it should be applied to
 * @param {Array.<String>} fields - The fields that should be made enumnerable
 */
const addEnumerableGetters = (object, fields) => {
  for (const field of fields) {
    let prop
    let proto = object
    // Walk up the proottype chain until a property with the given name is
    // found
    while (prop === undefined) {
      proto = Object.getPrototypeOf(proto)
      if (proto === null) {
        throw new Error(`no getter named '${field}' found`)
      }
      prop = Object.getOwnPropertyDescriptor(proto, field)
    }

    // There is a property with the correct name, but it's not a getter
    if (prop.get === undefined) {
      throw new Error(`no getter named '${field}' found`)
    }
    Object.defineProperty(object, field, {
      enumerable: true,
      get: prop.get
    })
  }
}

class DAGNode {
  constructor (data, links, serializedSize) {
    if (serializedSize !== 0) {
      assert(serializedSize, 'A DAGNode requires it\'s serialized size')
    }

    this._data = data || Buffer.alloc(0)
    this._links = links
    this._serializedSize = serializedSize

    // Make sure we have a nice public API that can be used by an IPLD resolver
    hidePrivateFields(this)
    addEnumerableGetters(this, ['data', 'Data', 'links', 'Links'])

    // Add getters for existing links by the name of the link
    // This is how paths are traversed in IPFS. Links with names won't
    // override existing fields like `data` or `links`.
    links.forEach((link, position) => {
      addNamedLink(this, link.name, position)
    })
  }

  toJSON () {
    return {
      data: this.data,
      links: this._links.map((l) => l.toJSON()),
      size: this.size
    }
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

  // Return links with primitive types, not as `DAGLink`
  get links () {
    return this._links.map((link) => {
      return {
        name: link.name,
        size: link.size,
        cid: link._cid
      }
    })
  }

  set links (links) {
    throw new Error("Can't set property: 'links' is read-only")
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

  // Getters for backwards compatible path resolving
  get Data () {
    return this.data
  }
  set Data (_) {
    throw new Error("Can't set property: 'Data' is read-only")
  }
  get Links () {
    return this._links.map((link) => {
      return {
        Name: link.name,
        Tsize: link.size,
        Hash: link._cid
      }
    })
  }
  set Links (_) {
    throw new Error("Can't set property: 'Links' is read-only")
  }
}

exports = module.exports = withIs(DAGNode, { className: 'DAGNode', symbolName: '@ipld/js-ipld-dag-pb/dagnode' })
exports.create = require('./create')
exports.clone = require('./clone')
exports.addLink = require('./addLink')
exports.rmLink = require('./rmLink')
