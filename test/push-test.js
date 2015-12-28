var url = process.env.COUCH || 'http://localhost:5984'
var dbname = 'couchdb-push-test'

var async = require('async')
var nano = require('nano')
var path = require('path')
var test = require('tap').test
var push = require('..')

var docs = [
  path.join(__dirname, 'fixtures/doc.json'),
  path.join(__dirname, 'fixtures/otherdoc.json')
]
var userdocs = [
  path.join(__dirname, 'fixtures/user.json'),
  path.join(__dirname, 'fixtures/changed-user.json')
]
var couch = nano(url)
var db = couch.use(dbname)

function rm (db, id, callback) {
  db.get(id, function (error, doc) {
    if (error) return callback(null)
    db.destroy(id, doc._id, callback)
  })
}

test('database not present', function (t) {
  couch.db.destroy(dbname, function () {
    push(url + '/' + dbname, docs[0], function (error, response) {
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
    push(url + '/' + dbname, docs[0], function (error, response) {
      t.error(error, 'no error')
      t.equal(response.ok, true, 'response is ok')

      t.end()
    })
  })
})

test('url as nano object', function (t) {
  push(db, docs[0], function (error, response) {
    t.error(error, 'no error')
    t.equal(response.ok, true, 'response is ok')

    t.end()
  })
})

test('doc unchanged', function (t) {
  couch.db.destroy(dbname, function () {
    push(url + '/' + dbname, docs[0], function (error, response) {
      t.error(error, 'no error')
      push(url + '/' + dbname, docs[0], function (error, response) {
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

test('user unchanged', function (t) {
  rm(couch.use('_users'), userdocs[0]._id, function (error) {
    t.error(error, 'no error')
    push(url + '/_users', userdocs[0], function (error, response) {
      t.error(error, 'no error')
      push(url + '/_users', userdocs[0], function (error, response) {
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

test('user password changed', function (t) {
  push(url + '/_users', userdocs[0], function (error, response) {
    t.error(error, 'no error')
    var rev = response.rev
    push(url + '/_users', userdocs[1], function (error, response) {
      t.error(error, 'no error')
      t.equal(response.ok, true, 'response is ok')
      t.notOk(response.unchanged, 'response is unchanged')
      t.ok(rev !== response.rev, 'rev has been changed')

      t.end()
    })
  })
})

test('database containing a slash', function (t) {
  var name = dbname + '/one'
  couch.db.destroy(name, function () {
    push(url + '/' + encodeURIComponent(name), docs[0], function (error, response) {
      t.error(error, 'no error')
      t.equal(response.ok, true, 'response is ok')

      t.end()
    })
  })
})

test('concurrency', function (t) {
  couch.db.destroy(dbname, function () {
    async.map(docs, function (doc, done) {
      push(url + '/' + dbname, doc, done)
    }, function (error, responses) {
      t.error(error, 'no error')
      t.equal(responses.length, docs.length, 'correct # of docs pushed')
      responses.forEach(function (response) {
        t.equal(typeof response, 'object', 'response is object')
        t.equal(response.ok, true, 'response is ok')
      })

      t.end()
    })
  })
})

