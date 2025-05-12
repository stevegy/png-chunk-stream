const Transform = require('stream').Transform
const inherits = require('inherits')
const crc32 = require('buffer-crc32')

const PNGsignature = new Buffer([137, 80, 78, 71, 13, 10, 26, 10])

function Encoder(opts) {
  if(!(this instanceof Encoder)) return new Encoder(opts)
  this.signature = false
  Transform.call(this, {objectMode: true})
}
inherits(Encoder, Transform)

Encoder.prototype._transform = function _transform(chunk, enc, cb) {
  if(!this.signature) {
    this.push(PNGsignature)
    this.signature = true
  }
  
  const length = new Buffer(4)
  // http://www.libpng.org/pub/png/book/chapter08.html#png.ch08.div.1
  // The length field is a 4-byte unsigned integer that indicates the
  // 4-byte length (in ``big-endian'' format, as with all integer values in PNG streams), a 4-byte chunk type, 
  // between 0 and 2,147,483,647 bytes of chunk data
  if (chunk.length > 2147483647 || chunk.data.length > 2147483647 
    || chunk.length < 0 || chunk.data.length < 0) {
    return cb(new Error('Chunk length exceeds maximum value'))
  }
  length.writeInt32BE(chunk.length || chunk.data.length, 0)
  this.push(length)
  
  const type = new Buffer(chunk.type)
  this.push(type)
  
  this.push(chunk.data)
  this.push(chunk.crc || crc32(Buffer.concat([type, chunk.data])))
  
  cb()
}

Encoder.prototype._flush = function (cb) {
  cb()
}

module.exports = Encoder