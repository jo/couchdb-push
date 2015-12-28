#!/usr/bin/env node

var minimist = require('minimist')
var push = require('./')

var options = minimist(process.argv.slice(2), {
  boolean: ['index', 'multipart', 'watch']
})
if (!options._.length) {
  console.log('Usage: \ncouchdb-push URL [SOURCE] [OPTIONS]')
  process.exit()
}

var db = options._[0]
var source = options._[1] || process.cwd()

push(db, source, options, function (error, response) {
  if (error) return console.error(error)

  console.log(JSON.stringify(response, null, '  '))
})
