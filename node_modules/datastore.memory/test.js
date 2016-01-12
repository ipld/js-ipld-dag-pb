var test = require('tape')
var MemDS = require('./')
var N = 10

var ds = MemDS()

test('should be not have anything (has)', function(t) {
  t.plan(N * 2)
  for (var i = 0; i < N; i++) {
    ds.has('i/' + i, function(err, has, key) {
      t.equal(err, null, 'should be fine')
      t.notOk(has, 'should be false')
    })
  }
})

test('should not have anything (get)', function(t) {
  t.plan(N * 2)
  for (var i = 0; i < N; i++) {
    ds.get('i/' + i, function(err, obj, key) {
      t.equal(err, MemDS.errors.NotFound, 'should be NotFound')
      t.notOk(obj, 'should be undefined')
    })
  }
})

test('should be able to put', function(t) {
  t.plan(N)
  for (var i = 0; i < N; i++) {
    ds.put('i/' + i, i * 1000, function(err, val, key) {
      t.equal(err, null, 'should be fine')
    })
  }
})

test('should now have the nums (has)', function(t) {
  t.plan(N * 2)
  for (var i = 0; i < N; i++) {
    ds.has('i/' + i, function(err, has, key) {
      t.equal(err, null, 'should be fine')
      t.equal(has, true, 'should be true')
    })
  }
})

test('should now have the nums (get)', function(t) {
  t.plan(N * 2)
  for (var i = 0; i < N; i++) {
    ds.get('i/' + i, function(err, obj, key) {
      t.equal(err, null, 'should be fine')
      t.equal(obj, parseInt(key.last() * 1000, 10), 'should be undefined')
    })
  }
})
