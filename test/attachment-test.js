var url = process.env.COUCH || 'http://localhost:5984';
var dbname = 'couchdb-push-test';

var nano = require('nano');
var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var push = require('..');

var source = path.join(__dirname, 'fixtures/attachment');
var couch = nano(url);
var db = couch.use(dbname);

var cases = {
  default: null,
  multipart: { multipart: true }
};

Object.keys(cases).forEach(function(c) {
  var options = cases[c];

  test('simple push ' + c, function(t) {
    couch.db.destroy(dbname, function(err, resp) {
      push(url + '/' + dbname, source, options, function(err, response) {
        t.equal(err, null, 'no error');
        t.equal(response.ok, true, 'response is ok');
        t.type(response.rev, 'string', 'response has rev');
        t.type(response.id, 'string', 'response has id');
        t.equal(response.unchanged, undefined, 'response is not unchanged');

        db.get(response.id, function(err, doc) {
          t.equal(err, null, 'no error');
          t.equal(Object.keys(doc._attachments).length, 2, 'two attachments present');
          
          t.end();
        });
      });
    });
  });

  test('doc unchanged ' + c, function(t) {
    couch.db.destroy(dbname, function(err, resp) {
      push(url + '/' + dbname, source, options, function(err, response) {
        db.get(response.id, function(err, doc) {
          t.equal(err, null, 'no error');
          t.equal(Object.keys(doc._attachments).length, 2, 'two attachments present');
          
          push(url + '/' + dbname, source, options, function(err, response) {
            t.equal(err, null, 'no error');
            t.equal(response.ok, true, 'response is ok');
            t.type(response.rev, 'string', 'response has rev');
            t.type(response.id, 'string', 'response has id');
            t.equal(response.unchanged, true, 'response is unchanged');

            db.get(response.id, function(err, doc) {
              t.equal(err, null, 'no error');
              t.equal(Object.keys(doc._attachments).length, 2, 'two attachments present');
              
              t.end();
            });
          });
        });
      });
    });
  });
});
