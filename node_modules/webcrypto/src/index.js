var isNode = !global.window

if (isNode) {
  module.exports = require('crypto')
} else {
  module.exports = require('crypto-browserify')
}
