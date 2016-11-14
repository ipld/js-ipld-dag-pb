'use strict'

const stable = require('stable')
const mh = require('multihashes')
const series = require('async/series')
const assert = require('assert')

const DAGLink = require('./dag-link')

function immutableError () {
  throw new Error('Immutable property')
}

class DAGNode {
  constructor (data, links, serialized, size, multihash, json) {
    assert(serialized, 'DAGNode needs its serialized format')
    assert(multihash, 'DAGNode needs its multihash')
    assert(json, 'DAGNode needs its json representation')

    if (typeof multihash === 'string') {
      multihash = mh.fromB58String(multihash)
    }

    Object.defineProperty(this, 'data', {
      get () {
        return data
      },
      set: immutableError
    })

    Object.defineProperty(this, 'links', {
      get () {
        return links
      },
      set: immutableError
    })

    Object.defineProperty(this, 'serialized', {
      get () {
        return serialized
      },
      set: immutableError
    })

    Object.defineProperty(this, 'size', {
      get () {
        return size
      },
      set: immutableError
    })

    Object.defineProperty(this, 'multihash', {
      get () {
        return multihash
      },
      set: immutableError
    })

    Object.defineProperty(this, 'json', {
      get () {
        return json
      },
      set: immutableError
    })

    this.link = {
      add: (nameOrLink, nodeOrMultihash, callback) => {
        if ((nameOrLink.constructor &&
             nameOrLink.constructor.name === 'DAGLink')) {
          // It's a link
          const link = nameOrLink
          // TODO
          // 1. add to the set of links
          // 2. create new node
        } else if (typeof nameOrLink === 'string') {
          // It's a name
          const name = nameOrLink
          if ((nodeOrMultihash.constructor &&
             nodeOrMultihash.constructor.name === 'DAGNode')) {
            // It's a node
            // TODO
            // 1. create link from name + node
            // 2. add to the set of links
            // 3. create new node
          } else {
            // It's a multihash
            let multihash = nodeOrMultihash
            if (typeof multihash === 'string') {
              multihash = mh.fromB58String(multihash)
            }
            // TODO
            // 1. create link from name + multihash
            // 2. add to the set of links
            // 3. create new node
          }
        }
        callback(new Error('invalid arguments'))
      },
      rm: (nameOrMultihash, callback) => {
        let links
        if (typeof nameOrMultihash === 'string') {
          const name = nameOrMultihash
          links = this.links.filter((link) => {
            if (link.name === name) {
              return false
            } else {
              return true
            }
          })
        } else if (Buffer.isBuffer(nameOrMultihash)) {
          const multihash = nameOrMultihash
          links = this.links.filter((link) => {
            if (link.hash.equals(multihash)) {
              return false
            } else {
              return true
            }
          })
        } else {
          callback(new Error('first arg needs to be a name or multihash'))
        }

        let dataClone

        if (this.data && this.data.length > 0) {
          dataClone = new Buffer(this.data.length)
          this.data.copy(dataClone)
        }

        DAGNode.create(dataClone, links, callback)
      }
    }
  }

  /*
   * makeLink returns a DAGLink node from a DAGNode
   */
  // TODO: this would make more sense as an utility
  makeLink (node, callback) {
    node.multihash((err, multihash) => {
      if (err) {
        return callback(err)
      }
      node.size((err, size) => {
        if (err) {
          return callback(err)
        }
        callback(null, new DAGLink(null, size, multihash))
      })
    })
  }

  /*
   * clone - returns a clone of the DAGNode
   */
  clone (callback) {
    let dataClone
    let linksClone

    if (this.data && this.data.length > 0) {
      dataClone = new Buffer(this.data.length)
      this.data.copy(dataClone)
    }

    if (this.links.length > 0) {
      linksClone = this.links.slice()
    }

    DAGNode.create(dataClone, linksClone, callback)
  }

  toString () {
    const mhStr = mh.toB58String(this.multihash)

    return `DAGNode <${mhStr} - data: "${this.data.toString()}", links: ${this.links.length}, size: ${this.size}>`
  }
}

function create (data, dagLinks, hashAlg, callback) {
  if (typeof data === 'function') {
    // empty obj
    callback = data
    data = undefined
  }
  if (typeof dagLinks === 'function') {
    // empty obj
    callback = dagLinks
    dagLinks = []
  }
  if (typeof hashAlg === 'function') {
    // empty obj
    callback = hashAlg
    hashAlg = undefined
  }

  if (!hashAlg) {
    hashAlg = 'sha2-256'
  }

  // validate links
  const links = []

  if (dagLinks) {
    dagLinks.forEach((l) => {
      if (l.constructor && l.constructor.name === 'DAGLink') {
        links.push(l)
      } else {
        links.push(
          new DAGLink(l.name || l.Name,
                      l.size || l.Size,
                      l.hash || l.Hash || l.multihash)
        )
      }
    })

    stable.inplace(links, util.linkSort)
  }

  let serialized
  let multihash
  let size
  let json

  series([
    (cb) => {
      util.serialize({
        data: data,
        links: links
      }, (err, _serialized) => {
        if (err) {
          return cb(err)
        }
        serialized = _serialized
        cb()
      })
    },
    (cb) => {
      util.hash(hashAlg, serialized, (err, _multihash) => {
        if (err) {
          return cb(err)
        }
        multihash = _multihash
        cb()
      })
    },
    (cb) => {
      if (!serialized) {
        size = 0
      }

      size = links.reduce((sum, l) => {
        return sum + l.size
      }, serialized.length)
      cb()
    },
    (cb) => {
      json = {
        data: data,
        links: links.map((l) => l.json),
        hash: mh.toB58String(multihash),
        size: size
      }
      cb()
    }
  ], (err) => {
    if (err) {
      return callback(err)
    }
    const node = new DAGNode(data,
                             links,
                             serialized,
                             size,
                             multihash,
                             json)
    callback(null, node)
  })
}

exports = module.exports = DAGNode
exports.create = create
const util = require('./util')
