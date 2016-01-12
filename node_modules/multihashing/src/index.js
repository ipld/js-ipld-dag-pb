var multihash = require('multihashes')
var crypto = require('webcrypto')
// var sha3 = require('sha3')
// sha3 broken. See: https://github.com/phusion/node-sha3/issues/5

var mh = module.exports = Multihashing

mh.Buffer = Buffer // for browser things

function Multihashing (buf, func, len) {
  return multihash.encode(mh.digest(buf, func, len), func, len)
}

// expose multihash itself, to avoid silly double requires.
mh.multihash = multihash

mh.digest = function (buf, func, length) {
  var digest = mh.createHash(func).update(buf).digest()

  if (length) {
    digest = digest.slice(0, length)
  }

  return digest
}

mh.createHash = function (func, length) {
  func = multihash.coerceCode(func)
  if (!mh.functions[func]) {
    throw new Error('multihash function ' + func + ' not yet supported')
  }

  return mh.functions[func]()
}

mh.functions = {
  0x11: gsha1,
  0x12: gsha2_256,
  0x13: gsha2_512
  // 0x14: gsha3, // broken
  // 0x40: blake2b, // not implemented yet
  // 0x41: blake2s, // not implemented yet
}

function gsha1 () {
  return crypto.createHash('sha1')
}

function gsha2_256 () {
  return crypto.createHash('sha256')
}

function gsha2_512 () {
  return crypto.createHash('sha512')
}

// function gsha3() {
//   return sha3.SHA3Hash()
// }
