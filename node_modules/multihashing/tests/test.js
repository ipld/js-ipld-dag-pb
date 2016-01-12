var test = require('tape')
var multihashing = require('../src')

test('sha1', function (t) {
  var buf = new Buffer('beep boop')

  var mh = multihashing(buf, 'sha1')
  t.deepEqual(mh, new Buffer(
    '11147c8357577f51d4f0a8d393aa1aaafb28863d9421'
  , 'hex'))

  t.end()
})

test('sha2-256', function (t) {
  var buf = new Buffer('beep boop')

  var mh = multihashing(buf, 'sha2-256')
  t.deepEqual(mh, new Buffer(
    '122090ea688e275d580567325032492b597bc77221c62493e76330b85ddda191ef7c'
  , 'hex'))

  t.end()
})

test('sha2-512', function (t) {
  var buf = new Buffer('beep boop')

  var mh = multihashing(buf, 'sha2-512')
  console.log(mh.toString('hex'))
  t.deepEqual(mh, new Buffer(
    '134014f301f31be243f34c5668937883771fa381002f1aaa5f31b3f78e500b66ff2f4f8ea5e3c9f5a61bd073e2452c480484b02e030fb239315a2577f7ae156af177'
  , 'hex'))

  t.end()
})
