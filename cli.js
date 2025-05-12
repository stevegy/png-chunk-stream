#!/usr/bin/env node

const decoder = require('./').decode()
const encoder = require('./').encode()
const through = require('through2')
const ndjson = require('ndjson')

const method = process.argv[2]

if(method === 'encode') {
  process.stdin
    .pipe(ndjson.parse())
    .pipe(through.obj(function (chunk, enc, cb) {
      chunk.data = new Buffer(chunk.data, 'base64')
      chunk.crc = new Buffer(chunk.crc, 'base64')
      this.push(chunk)
      cb()
    }))
    .pipe(encoder)
    .pipe(process.stdout)
} else if(method === 'decode'){
  try {
    process.stdin
      .pipe(decoder)
      .on('error', err => {
        console.error(`decode error:`, err)
        process.exit(1)
      })
      .pipe(through.obj(function (chunk, enc, cb) {
        chunk.data = chunk.data.toString('base64')
        chunk.crc = chunk.crc.toString('base64')
        this.push(chunk)
        cb()
      }))
      .pipe(ndjson.stringify())
      .pipe(process.stdout)
  } catch (e) {
    console.error(`Catch error:`, e)
  }
} else {
  console.error('Usage: png-chunk [encode/decode]')
}

