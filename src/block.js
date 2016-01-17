var util = require('./util')

// Immutable block of data

function Block (data) {
  if (!data) {
    throw new Error('Block must be constructed with data')
  }

  if (!(this instanceof Block)) {
    return new Block(data)
  }

  this.data = new Buffer(data)
  this.key = util.hash(this.data)
}
module.exports = Block
