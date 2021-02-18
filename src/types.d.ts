import CID from 'cids'

export interface DAGLinkLike {
  Hash: CID
  Name: string
  Tsize: number
}

export interface SerializableDAGLink {
  Hash: Uint8Array
  Name: string
  Tsize: number
}

export interface SerializableDAGNode {
  Data?: Uint8Array | null
  Links?: SerializableDAGLink[] | null
}
