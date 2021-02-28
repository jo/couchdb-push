#!/usr/bin/env node

const minimist = require('minimist')
const push = require('./')

const options = minimist(process.argv.slice(2), {
  boolean: ['index', 'multipart', 'watch']
})
if (!options._.length) {
  console.log('Usage: \ncouchdb-push URL [SOURCE] [OPTIONS]')
  process.exit()
}

const db = options._[0]
const source = options._[1] || process.cwd()

push(db, source, options, function (error, response) {
  if (error) return console.error(error)

  console.log(JSON.stringify(response, null, '  '))
})
