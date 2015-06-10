#!/usr/bin/env node

var push = require('./')

var args = process.argv.slice(2)
if (!args.length) {
  return console.log('Usage: \ncouchdb-push URL [SOURCE]')
}

var db = args[0]
var source = args[1] || process.cwd()

push(db, source, { multipart: true }, function(error, response) {
  if (error) return console.error(error)

  console.log(JSON.stringify(response, null, '  '))
})
