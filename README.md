IPFS Merkle DAG JavaScript Implementation
=========================================

[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
![](https://img.shields.io/badge/coverage-75%25-yellow.svg?style=flat-square)
![](https://travis-ci.org/vijayee/js-ipfs-merkle-dag.svg?branch=master)
[![Dependency Status](https://david-dm.org/vijayee/js-ipfs-merkle-dag.svg?style=flat-square)](https://david-dm.org/vijayee/js-ipfs-merkledag)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> JavaScript Implementation of the DAGService and DAGNode data structure

## Architecture

```markdown
┌────────────────────┐
│   DAGService       │
└────────────────────┘
           │
           ▼
┌────────────────────┐
│   BlockService     │
└────────────────────┘
```

**DAGService** - The DAGService offers an interface to interact directly with a MerkleDAG object (composed by one or more DAGNodes that are linked), using the BlockService to store and fetch the DAGNodes as it needs them

[**BlockService** - The BlockService uses IPFS Repo as the local datastore for blocks and an IPFS Exchange compliant implementation to fetch blocks from the network.](https://github.com/ipfs/js-ipfs-block-service)

A DAGNode and DAGLink are data structures made available on this module.

## Usage

```bash
$ npm i ipfs-merkle-dag
```

```javascript
const ipfsMDAG = require('ipfs-merkle-dag')

// then, to access each of the components
ipfsMDAG.DAGService
ipfsMDAG.DAGNode
ipfsMDAG.DAGLink
```

### DAGNode

Create a new DAGLink

```JavaScript
var link = new ipfsMDAG.DAGLink(<name>, <size>, <hash>)
```

Create a new DAGNode

```JavaScript
var node = new ipfsMDAG.DAGNode([<data>, <[links]>])
```

##### addNodeLink

> creates a link on node A to node B by using node B to get its multihash

##### addRawLink

> creates a link on node A to node B by using direclty node B multihash

##### updateNodeLink

> updates a link on the node. *caution* this method returns a copy of the MerkleDAG node

##### removeNodeLink

> removes a link from the node by name

##### removeNodeLinkByHash

> removes a link from the node by the hash of the linked node


##### copy

> creates a copy of the MerkleDAG Node

##### size

> size of the node. This is a property, not a function

##### multihash

> returns the multihash (default: sha2-256)

##### marshal

> returns a protobuf serialized version, compatible with go-ipfs MerkleDAG

##### unMarshal

> desirializes a probuf serialized node

##### (used internally) getPBNode

> used internally

##### (used internally) makeLink

> used internally

### DAGService

##### add

> stores the node

##### get

> fetches a node by its multihash

##### getRecursive

> fetches a node and all of its links (if possible)

##### remove

> deletes a node

## License

[LICENSE](LICENSE.md)
