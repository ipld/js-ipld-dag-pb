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
> npm i ipld-dag-pb
```

## Usage

```js
const dagPB = require('ipld-dag-pb')

// then, to access each of the components
dagPB.DAGNode
dagPB.resolver
```

## API

### DAGNode Class

Create a new DAGNode

```JavaScript
var node = new dagPB.DAGNode([<data>, <[links]>])
```

#### `addNodeLink`

> creates a link on node A to node B by using node B to get its multihash

#### `addRawLink`

> creates a link on node A to node B by using directly node B multihash

#### `updateNodeLink`

> updates a link on the node. *caution* this method returns a copy of the MerkleDAG node

#### `removeNodeLink`

> removes a link from the node by name

#### `removeNodeLinkByHash`

> removes a link from the node by the hash of the linked node


#### `clone`

> creates a clone of the MerkleDAG Node

#### `size`

> (property) size of the node, in bytes

#### `links`

> (property) an array of `DAGLink`s belonging to the node

#### `multihash(callback)`

> returns the multihash (default: sha2-256)

#### `getPBNode`

> used internally

#### `makeLink`

> used internally

### DAGLink Class

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
