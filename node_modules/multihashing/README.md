js-multihashing
===============

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io) [![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs) ![](https://img.shields.io/badge/coverage-%3F-yellow.svg?style=flat-square) [![Dependency Status](https://david-dm.org/jbenet/multihashing.svg?style=flat-square)](https://david-dm.org/jbenet/js-multihashing) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

Use all the functions in [multihash](//github.com/jbenet/multihash).

> Wait, why, how is this different from Node `crypto`?

This module just makes working with multihashes a bit nicer.
[js-multihash](//github.com/jbenet/js-multihash) is only for
encoding/decoding multihashes, and does not depend on other libs.
This module will depend on various implementations for each hash.
For now, it just uses `crypto`, but will use `sha3` and `blake2`, etc.

## Installation

### In Node.js through npm

```bash
$ npm install --save multihashing
```

```javascript
var multihashing = require('multihashing')
```

### In the Browser through browserify

Same as in Node.js, you just have to [browserify](https://github.com/substack/js-browserify) the code before serving it. See the browserify repo for how to do that.

### In the Browser through `<script>` tag

Make the [multihashing.min.js](/dist/multihashing.min.js) available through your server and load it using a normal `<script>` tag, this will export the `multihashing` constructor on the `window` object, such that:

```JavaScript
var multihashing = window.multihashing
```

#### Gotchas

You will need to use Node.js `Buffer` API compatible, if you are running inside the browser, you can access it by `multihashing.Buffer` or you can install Feross's [Buffer](https://github.com/feross/buffer).

## Usage

```js
var multihashing = require('multihashing')
var buf = new Buffer('beep boop')

// by default returns a multihash.
multihashing(buf, 'sha1')

// Use `.digest(...)` if you want only the hash digest.
multihashing.digest(buf, 'sha1')

// Use `.createHash(...)` for a `crypto.createHash` interface.
var h = multihashing.createHash('sha1')
h.update(buf)
h.digest()
```

## Examples

### Multihash output

```js
> var multihashing = require('multihashing')
> var buf = new Buffer('beep boop')

> console.log(multihashing(buf, 'sha1'))
<Buffer 11 14 7c 83 57 57 7f 51 d4 f0 a8 d3 93 aa 1a aa fb 28 86 3d 94 21>

> console.log(multihashing(buf, 'sha2-256'))
<Buffer 12 20 90 ea 68 8e 27 5d 58 05 67 32 50 32 49 2b 59 7b c7 72 21 c6 24 93 e7 63 30 b8 5d dd a1 91 ef 7c>

> console.log(multihashing(buf, 'sha2-512'))
<Buffer 13 40 14 f3 01 f3 1b e2 43 f3 4c 56 68 93 78 83 77 1f a3 81 00 2f 1a aa 5f 31 b3 f7 8e 50 0b 66 ff 2f 4f 8e a5 e3 c9 f5 a6 1b d0 73 e2 45 2c 48 04 84 b0 ...>
```

### Raw digest output

```js
> var multihashing = require('multihashing')
> var buf = new Buffer('beep boop')

> console.log(multihashing.digest(buf, 'sha1'))
<SlowBuffer 7c 83 57 57 7f 51 d4 f0 a8 d3 93 aa 1a aa fb 28 86 3d 94 21>

> console.log(multihashing.digest(buf, 'sha2-256'))
<SlowBuffer 90 ea 68 8e 27 5d 58 05 67 32 50 32 49 2b 59 7b c7 72 21 c6 24 93 e7 63 30 b8 5d dd a1 91 ef 7c>

> console.log(multihashing.digest(buf, 'sha2-512'))
<SlowBuffer 14 f3 01 f3 1b e2 43 f3 4c 56 68 93 78 83 77 1f a3 81 00 2f 1a aa 5f 31 b3 f7 8e 50 0b 66 ff 2f 4f 8e a5 e3 c9 f5 a6 1b d0 73 e2 45 2c 48 04 84 b0 2e 03 ...>
```

## License

MIT
