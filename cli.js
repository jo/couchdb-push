#!/usr/bin/env node

var push = require('./');

var args = process.argv.slice(2);
if (!args.length) {
  return console.log('Usage: \ncouch-push URL [DIR]');
}

var url = args[0];
var source = args[1] || process.cwd();

push(url, source, { multipart: true }, function(err, response) {
  console.log(err || response);
});
