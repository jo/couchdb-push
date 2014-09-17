var url = process.env.COUCH || 'http://localhost:5984';
var dbname = 'couch-push-test';

var nano = require('nano');
var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var push = require('..');

var source = path.join(__dirname, 'fixtures/doc.json');
var couch = nano(url);
var db = couch.use(dbname);

test('database not present', function(t) {
  couch.db.destroy(dbname, function(err, resp) {
    push(url + '/' + dbname, source, function(err, response) {
      t.equal(err, null, 'no error');
      t.equal(response.ok, true, 'response is ok');
      t.type(response.rev, 'string', 'response has rev');
      t.type(response.id, 'string', 'response has id');
      t.equal(response.unchanged, undefined, 'response is not unchanged');

      t.end();
    });
  });
});

test('database is present', function(t) {
  couch.db.create(dbname, function(err, resp) {
    push(url + '/' + dbname, source, function(err, response) {
      t.equal(err, null, 'no error');
      t.equal(response.ok, true, 'response is ok');

      t.end();
    });
  });
});

test('doc unchanged', function(t) {
  couch.db.destroy(dbname, function(err, resp) {
    push(url + '/' + dbname, source, function(err, response) {
      push(url + '/' + dbname, source, function(err, response) {
        t.equal(err, null, 'no error');
        t.equal(response.ok, true, 'response is ok');
        t.type(response.rev, 'string', 'response has rev');
        t.type(response.id, 'string', 'response has id');
        t.equal(response.unchanged, true, 'response is unchanged');

        t.end();
      });
    });
  });
});

test('database containing a slash', function(t) {
  var name = dbname + '/one'
  couch.db.destroy(name, function(err, resp) {
    push(url + '/' + encodeURIComponent(name), source, function(err, response) {
      t.equal(err, null, 'no error');
      t.equal(response.ok, true, 'response is ok');

      t.end();
    });
  });
});

