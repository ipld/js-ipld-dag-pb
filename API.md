# API

## DAGNode

Create a new DAGLink

```JavaScript
var link = new ipfsMDAG.DAGLink(<name>, <size>, <hash>)
```

Create a new DAGNode

```JavaScript
var node = new ipfsMDAG.DAGNode([<data>, <[links]>])
```

### `addNodeLink`

> creates a link on node A to node B by using node B to get its multihash

### `addRawLink`

> creates a link on node A to node B by using directly node B multihash

### `updateNodeLink`

> updates a link on the node. *caution* this method returns a copy of the MerkleDAG node

### `removeNodeLink`

> removes a link from the node by name

### `removeNodeLinkByHash`

> removes a link from the node by the hash of the linked node


### `copy`

> creates a copy of the MerkleDAG Node

### `size`

> (property) size of the node, in bytes

### `links`

> (property) an array of `DAGLink`s belonging to the node

### `multihash`

> returns the multihash (default: sha2-256)

### `marshal`

> returns a protobuf serialized version, compatible with go-ipfs MerkleDAG

### `unMarshal`

> deserializes a node encoded using protobuf

### `getPBNode`

> used internally

### `makeLink`

> used internally

## DAGService

### `put`

> stores the node

### `putStream`

> stores nodes using a writable pull-stream

### `get`

> fetches a node by its multihash

### `getStream`

> fetches a node as a pull-stream

### `getRecursive`

> fetches a node and all of its links (if possible)

### `getRecursiveStream`

> fetches a node and all of its links (if possible) as pull-stream

### `remove`

> deletes a node
