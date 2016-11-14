# js-ipld-dag-pb

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Coverage Status](https://coveralls.io/repos/github/ipld/js-ipld-dag-pb/badge.svg?branch=master)](https://coveralls.io/github/ipld/js-ipld-dag-pb?branch=master)
[![Travis CI](https://travis-ci.org/ipld/js-ipld-dag-pb.svg?branch=master)](https://travis-ci.org/ipld/js-ipld-dag-pb)
[![Circle CI](https://circleci.com/gh/ipld/js-ipld-dag-pb.svg?style=svg)](https://circleci.com/gh/ipld/js-ipld-dag-pb)
[![Dependency Status](https://david-dm.org/ipld/js-ipld-dag-pb.svg?style=flat-square)](https://david-dm.org/ipld/js-ipld-dag-pb)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/ipld-js-dag-pb.svg)](https://saucelabs.com/u/ipld-js-dag-pb)

> JavaScript Implementation of the IPLD Format MerkleDAG Node in Protobuf.

## Table of Contents

- [Install](#install)
- [Architecture](#architecture)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)

## Install

```bash
> npm install ipld-dag-pb --save
```

## Usage

```js
const dagPB = require('ipld-dag-pb')

// then, to access each of the components
dagPB.DAGNode.create // function to create DAGNodes
dagPB.resolver
dagPB.util
```

## API

### DAGNode

DAGNodes are created and manipulated with `DAGNode` class methods. You **can't instantiate a DAGNode directly** with `new DAGNode(...)`.

You can incude it in your project with:

```javascript
const dagPB = require('ipld-dag-pb').DAGNode
```

#### create(data, dagLinks, hashAlg, callback)

Create a DAGNode.

```JavaScript
DAGNode.create("data", (err, dagNode) => ...) 
```

#### addLink(dagNode, nameOrLink, nodeOrMultihash, callback)

Creates a link on node A to node B by using node B to get its multihash. Returns a *new* instance of DAGNode without modifying the old one.

```JavaScript
DAGNode.addLink(node, "Link1" (err, dagNode) => ...) 
```

#### removeLink(dagNode, nameOrMultihash, callback)

Removes a link from the node by name. Returns a *new* instance of DAGNode without modifying the old one.

```JavaScript
DAGNode.removeLink(node, "Link1" (err, dagNode) => ...) 
```

#### clone(dagNode, callback)

Creates a clone of the MerkleDAG Node

```JavaScript
DAGNode.clone(node, (err, dagNode) => ...) 
```

### DAGNode

The DAGNode instance returned by `DAGNode` class methods has the following properties. You **can't instantiate a DAGNode directly** with `new DAGNode(...)`, see [DAGNode.create()](#create) for details.

#### size

Size of the node, in bytes

```JavaScript
const size = dagNode.size
```

#### links

An array of `DAGLink`s belonging to the node

```JavaScript
const links = dagNode.links
```

#### multihash

Returns the multihash (default: sha2-256)

```JavaScript
const multihash = dagNode.multihash
```

### DAGLink

Create a new DAGLink

```JavaScript
var link = new dagPB.DAGLink(<name>, <size>, <hash>)
```

### Local Resolver (to be used by the IPLD Resolver)

#### `resolver.resolve`

#### `resolver.tree`

#### `resolver.patch`

## License

MIT © IPFS
