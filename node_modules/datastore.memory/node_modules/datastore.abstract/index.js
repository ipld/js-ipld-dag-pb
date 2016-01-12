var Key = require('./key')
var extend = require('xtend')
var inherits = require('inherits')

module.exports = Datastore

function Datastore() {}

var err = Datastore.errors = {
  NotFound: new Error('Key Not Found'),
  NotImplemented: new Error('Not Implemented'),

  KeyRequired: new Error('Key Required'),
  ValueRequired: new Error('Value Required'),
  CallbackRequired: new Error('Callback Required'),

  UseCallback: new Error('No return, use callback'),
}

Datastore.inherits = function(child, parent) {
  parent = parent || Datastore
  inherits(child, parent)
  child.inherits = Datastore.inherits
  child.errors = extend(Datastore.errors)
  return child
}

Datastore.prototype.get = function(key, callback) {
  if (!this._get) throw err.NotImplemented
  if (!callback) throw err.CallbackRequired
  if (!key) throw err.KeyRequired
  this._get(Key(key), deferred(callback))
  return err.UseCallback
}

Datastore.prototype.put = function(key, value, callback) {
  if (!this._put) throw err.NotImplemented
  if (value === undefined) throw err.ValueRequired
  if (!key) throw err.KeyRequired
  this._put(Key(key), value, deferred(callback))
  return err.UseCallback
}

Datastore.prototype.delete = function(key, callback) {
  if (!this._delete) throw err.NotImplemented
  if (!key) throw err.KeyRequired
  this._delete(Key(key), deferred(callback))
  return err.UseCallback
}

Datastore.prototype.has = function(key, callback) {
  if (!this._has) throw err.NotImplemented
  if (!callback) throw err.CallbackRequired
  if (!key) throw err.KeyRequired
  this._has(Key(key), deferred(callback))
  return err.UseCallback
}


Datastore.deferred = deferred

function deferred(func) {
  if (!func) return function() {} // undefined? return empty func

  return function() {
    var args = Array.prototype.slice.call(arguments, 0)
    process.nextTick(function() {
      func.apply(this, args)
    })
  }
}
