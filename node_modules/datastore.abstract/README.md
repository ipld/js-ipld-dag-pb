# node-datastore interface

datastore is a generic layer of abstraction for data store and database access. It is a simple API with the aim to enable application development in a datastore-agnostic way, allowing datastores to be swapped seamlessly without changing application code. Thus, one can leverage different datastores with different strengths without committing the application to one datastore throughout its lifetime.

In addition, grouped datastores significantly simplify interesting data access patterns (such as caching and sharding).

Based on [datastore.py](https://github.com/jbenet/datastore).

Note: this is similar to [rvagg/abstract-leveldown](https://github.com/rvagg/abstract-leveldown/). Though I wrote [my original datastore](https://github.com/jbenet/datastore) many years ago. :)

## Example

### Usage

See [datastore.memory/try.js](https://github.com/jbenet/node-datastore.memory/blob/master/try.js):

```js
var memDS = require('datastore.memory')
ds.put('foo', 'bar', function(err, val, key) {
  if (err) throw err
  console.log('put ' + key + ': ' + val)
  assert(val === 'bar')
})

ds.has('foo', function(err, has, key) {
  if (err) throw err
  console.log(key + ' exists? ' + has)
  assert(has === true)
})

ds.get('foo', function(err, val, key) {
  if (err) throw err
  console.log('get ' + key + ': ' + val)
  assert(val === 'bar')
})

ds.delete('foo', function(err, key) {
  if (err) throw err
  console.log(key + ' deleted')
})

ds.has('foo', function(err, has, key) {
  if (err) throw err
  console.log(key + ' exists? ' + has)
  assert(has === false)
})
```

### Implementation

See [datastore.memory/index.js](https://github.com/jbenet/node-datastore.memory/blob/master/index.js):

```js
var DS = require('datastore.abstract')

module.exports = MemDS

function MemDS() {
  if (!(this instanceof MemDS))
    return new MemDS
  DS.call(this)
  this.values = {}
}

DS.inherits(MemDS)

MemDS.prototype._get = function(key, cb) {
  var val = this.values[key.toString()]
  if (val !== undefined) cb(null, val, key)
  else cb(MemDS.errors.NotFound, null, key)
}

MemDS.prototype._put = function(key, val, cb) {
  this.values[key.toString()] = val
  cb(null, val, key)
}

MemDS.prototype._delete = function(key, cb) {
  delete this.values[key.toString()]
  cb(null, key)
}

MemDS.prototype._has = function(key, cb) {
  var has = (this.values[key.toString()] !== undefined)
  cb(null, has, key)
}
```


## License

MIT
