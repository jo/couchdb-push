const url = process.env.COUCH || 'http://localhost:5984'
const dbname = 'couchdb-push-attachments-test'

const nano = require('nano')
const path = require('path')
const test = require('tap').test
const push = require('..')

const source = path.join(__dirname, 'fixtures/attachment')
const couch = nano(url)
const db = couch.use(dbname)

const cases = {
  default: null,
  multipart: { multipart: true }
}

Object.keys(cases).forEach(function (c) {
  const options = cases[c]

  test('simple push ' + c, function (t) {
    couch.db.destroy(dbname, function () {
      push(url + '/' + dbname, source, options, function (error, response) {
        t.error(error, 'no error')
        t.equal(response.ok, true, 'response is ok')
        t.type(response.rev, 'string', 'response has rev')
        t.type(response.id, 'string', 'response has id')
        t.equal(response.unchanged, undefined, 'response is not unchanged')

        db.get(response.id, function (error, doc) {
          t.error(error, 'no error')
          t.equal(Object.keys(doc._attachments).length, 2, 'two attachments present')

          t.end()
        })
      })
    })
  })

  test('doc unchanged ' + c, function (t) {
    couch.db.destroy(dbname, function () {
      push(url + '/' + dbname, source, options, function (error, response) {
        t.error(error, 'no error')
        db.get(response.id, function (error, doc) {
          t.error(error, 'no error')
          t.equal(Object.keys(doc._attachments).length, 2, 'two attachments present')

          push(url + '/' + dbname, source, options, function (error, response) {
            t.error(error, 'no error')
            t.equal(response.ok, true, 'response is ok')
            t.type(response.rev, 'string', 'response has rev')
            t.type(response.id, 'string', 'response has id')
            t.equal(response.unchanged, true, 'response is unchanged')

            db.get(response.id, function (error, doc) {
              t.error(error, 'no error')
              t.equal(Object.keys(doc._attachments).length, 2, 'two attachments present')

              t.end()
            })
          })
        })
      })
    })
  })
})
