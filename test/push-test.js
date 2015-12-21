var url = process.env.COUCH || 'http://localhost:5984'
var dbname = 'couchdb-push-test'

var async = require('async')
var nano = require('nano')
var path = require('path')
var test = require('tap').test
var push = require('..')

var sources = [
  path.join(__dirname, 'fixtures/doc.json'),
  path.join(__dirname, 'fixtures/otherdoc.json')
]
var source = sources[0]
var couch = nano(url)
var db = couch.use(dbname)

test('database not present', function (t) {
  couch.db.destroy(dbname, function () {
    push(url + '/' + dbname, source, function (error, response) {
      t.error(error, 'no error')
      t.equal(response.ok, true, 'response is ok')
      t.type(response.rev, 'string', 'response has rev')
      t.type(response.id, 'string', 'response has id')
      t.equal(response.unchanged, undefined, 'response is not unchanged')

      t.end()
    })
  })
})

test('database is present', function (t) {
  couch.db.create(dbname, function () {
    push(url + '/' + dbname, source, function (error, response) {
      t.error(error, 'no error')
      t.equal(response.ok, true, 'response is ok')

      t.end()
    })
  })
})

test('url as nano object', function (t) {
  push(db, source, function (error, response) {
    t.error(error, 'no error')
    t.equal(response.ok, true, 'response is ok')

    t.end()
  })
})

test('doc unchanged', function (t) {
  couch.db.destroy(dbname, function () {
    push(url + '/' + dbname, source, function (error, response) {
      t.error(error, 'no error')
      push(url + '/' + dbname, source, function (error, response) {
        t.error(error, 'no error')
        t.equal(response.ok, true, 'response is ok')
        t.type(response.rev, 'string', 'response has rev')
        t.type(response.id, 'string', 'response has id')
        t.equal(response.unchanged, true, 'response is unchanged')

        t.end()
      })
    })
  })
})

test('database containing a slash', function (t) {
  var name = dbname + '/one'
  couch.db.destroy(name, function () {
    push(url + '/' + encodeURIComponent(name), source, function (error, response) {
      t.error(error, 'no error')
      t.equal(response.ok, true, 'response is ok')

      t.end()
    })
  })
})

test('concurrency', function (t) {
  couch.db.destroy(dbname, function () {
    async.map(sources, function (source, done) {
      push(url + '/' + dbname, source, done)
    }, function (error, responses) {
      t.error(error, 'no error')
      t.equal(responses.length, sources.length, 'correct # of docs pushed')
      responses.forEach(function (response) {
        t.equal(typeof response, 'object', 'response is object')
        t.equal(response.ok, true, 'response is ok')
      })

      t.end()
    })
  })
})

