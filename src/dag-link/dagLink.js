'use strict'

const CID = require('cids')
const assert = require('assert')
const withIs = require('class-is')

// Link represents an IPFS Merkle DAG Link between Nodes.
class DAGLink {
  constructor (name, cid) {
    assert(cid, 'A link requires a cid to point to')
    // assert(size, 'A link requires a size')
    //  note - links should include size, but this assert is disabled
    //  for now to maintain consistency with go-ipfs pinset

    this._name = name || ''
    this._nameBuf = null
    this._cid = new CID(cid)
  }

  toString () {
    return `DAGLink <${this._cid.toBaseEncodedString()} - name: "${this.Name}">`
  }

  toJSON () {
    if (!this._json) {
      this._json = Object.freeze({
        name: this.Name,
        cid: this.Hash.toBaseEncodedString()
      })
    }

    return Object.assign({}, this._json)
  }

  get Name () {
    return this._name
  }

  // Memoize the Buffer representation of name
  // We need this to sort the links, otherwise
  // we will reallocate new buffers every time
  get nameAsBuffer () {
    if (this._nameBuf !== null) {
      return this._nameBuf
    }

    this._nameBuf = Buffer.from(this._name)
    return this._nameBuf
  }

  set Name (name) {
    throw new Error("Can't set property: 'name' is immutable")
  }

  get Hash () {
    return this._cid
  }

  set Hash (cid) {
    throw new Error("Can't set property: 'cid' is immutable")
  }
}

exports = module.exports = withIs(DAGLink, { className: 'DAGLink', symbolName: '@ipld/js-ipld-dag-pb/daglink' })
