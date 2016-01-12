var path = require('path')

module.exports = Key

function Key(k) {
  if (!(this instanceof Key))
    return new Key(k)

  if (arguments.length > 1)
    k = Array.prototype.slice.call(arguments, 0)

  if (k instanceof Key)
    k = k.string
  if (typeof(k) === 'string' || k instanceof String)
    k = splitStringKey(k)
  if (Array.isArray(k))
    k = cleanArray(k)

  this.parts = k
}

Key.prototype.inspect = function() {
  return "<Key "+ this.toString() +">"
}

Key.prototype.toString = function() {
  return joinArrayKey(this.parts)
}

Key.prototype.length = function() {
  return this.parts.length
}

Key.prototype.isRoot = function() {
  return this.parts.length == 0
}

Key.prototype.first = function() {
  return this.parts[0]
}

Key.prototype.last = function() {
  return this.parts[this.parts.length - 1]
}

Key.prototype.child = function(name) {
  return Key(this.parts.concat([name]))
}

Key.prototype.parent = function() {
  return this.slice(0, a.length - 2)
}

Key.prototype.prepend = function(p) {
  return Key(p).concat(this)
}

Key.prototype.append = function(p) {
  return this.concat(p)
}

Key.prototype.slice = function() {
  return Key(this.parts.slice.apply(this.parts, arguments))
}

Key.prototype.concat = function(p) {
  return Key(this.parts.concat(Key(p).parts))
}

Key.prototype.equals = function(p) {
  return this.toString() == p.toString()
}

Key.sep = '/'

function splitStringKey(s) {
  return s.split(Key.sep)
}

function joinArrayKey(a) {
  return Key.sep + a.join(Key.sep)
}

function cleanArray(a) {
  var n = []
  for (var i in a) {
    i = a[i]
    if (i)
      n.push(i)
  }
  return n
}
