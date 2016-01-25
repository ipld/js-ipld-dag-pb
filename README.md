IPFS Merkle DAG JavaScript Implementation
=========================================

[[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
![](https://img.shields.io/badge/coverage-75%25-yellow.svg?style=flat-square) [![Dependency Status](https://david-dm.org/ipfs/js-ipfs-merkle-dag.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-merkledag) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> JavaScript Implementation of the DAGService, BlockService and Block + DAGNode data structures

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
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌────────┐
│IPFS REPO│ │Exchange│
└─────────┘ └────────┘
```

**DAGService** - The DAGService offers an interface to interact directly with a MerkleDAG object (composed by one or more DAGNodes that are linked), using the BlockService to store and fetch the DAGNodes as it needs them

**BlockService** - The BlockService uses IPFS Repo as the local datastore for blocks and an IPFS Exchange compliant implementation to fetch blocks from the network.

A DAGNode and a Block are data structures made available on this module.

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
ipfsMDAG.BlockService
ipfsMDAG.Block
```

#### Block

Create a new block

```JavaScript
var block = new ipfsMDAG.Block('some data')
console.log(block.data) 
// It will print 'some data'
console.log(block.key)
// It will print the sha256 multihash of 'some data'
```

#### BlockService

Create a new block service

```JavaScript
var bs = new ipfsMDAG.BlockService(<IPFS REPO instance> [, <IPFS Exchange>])
```

##### addBlock

```JavaScript
bs.addBlock(block, function (err) {
  if (!err) {
    // block successfuly added
  }
})
```

##### addBlocks

```JavaScript
bs.addBlocks(blockArray, function (err) {
  if (!err) {
    // blocks successfuly added
  }
})
```

##### getBlock

```JavaScript
bs.getBlock(multihash, function (err, block) {
  if (!err) {
    // block successfuly retrieved
  }
})
```


##### getBlocks

```JavaScript
bs.getBlocks(multihashArray, function (err, block) {
  if (!err) {
    // block successfuly retrieved
  }
})
```

##### deleteBlock

```JavaScript
bs.deleteBlock(multihash, function (err) {
  if (!err) {
    // block successfuly deleted
  }
})
```

##### deleteBlocks

```JavaScript
bs.deleteBlocks(multihashArray, function (err) {
  if (!err) {
    // blocks successfuly deleted
  }
})
```



#### DAGNode

Create a new DAGLink

```JavaScript
var link = new ipfsMDAG.DAGLink(<name>, <size>, <hash>)
```

Create a new DAGNode

```JavaScript
var node = new ipfsMDAG.DAGNode([<data>, <[links]>])
```

##### updateNodeLink

##### removeNodeLink

##### copy

##### makeLink

##### addRawLink

##### addNodeLinkClean

##### size

##### encoded

##### multihash

##### marshal

##### unMarshal

##### getPBNode

#### DAGService

## License

[LICENSE](LICENSE.md)
