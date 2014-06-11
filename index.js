// couch-push
// (c) 2014 Johannes J. Schmidt

var assert = require('assert');
var async = require('async');
var nano = require('nano');
var compile = require('couch-compile');


module.exports = function push(url, source, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  try {
    var db = nano(url);
  } catch(e) {
    return callback({ error: 'invalid_url', reason: 'Not a valid database URL: ' + url });
  }

  if (!db.config.db) {
    return callback({ error: 'no_db', reason: 'Not a database: ' + url });
  }


  function pushDoc(doc) {
    db.insert(doc, doc._id, callback);
  }

  function diffDoc(doc, exitingDoc) {
    doc._rev = exitingDoc._rev;

    try {
      assert.deepEqual(doc, exitingDoc);
      callback(null, { ok: true, id: doc._id, rev: doc._rev, unchanged: true });
    } catch(e) {
      pushDoc(doc);
    }
  }

  function getDoc(doc) {
    db.get(doc._id, function(err, response) {
      if (err && err.status_code === 404) {
        return pushDoc(doc);
      }

      diffDoc(doc, response);
    })
  }

  
  function compileDoc() {
    compile(source, options, function(err, doc) {
      if (err) {
        return callback(err);
      }

      if (!doc._id) {
        return callback({ error: 'missing_id', reason: 'Missing _id property' });
      }

      getDoc(doc);
    });
  }


  var couch = nano(db.config.url);
  couch.db.get(db.config.db, function(err, info) {
    if (err && err.status_code === 404) {
      return couch.db.create(db.config.db, function(err, response) {
        if (err) {
          return callback({ error: err.error, reason: err.reason });
        }

        compileDoc();
      });
    }

    if (err) {
      return callback({ error: err.error, reason: err.reason });
    }

    compileDoc();
  });
};
