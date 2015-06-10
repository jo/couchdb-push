// couchdb-push
// (c) 2014 Johannes J. Schmidt

var crypto = require('crypto');
var assert = require('assert');
var async = require('async');
var nano = require('nano');
var compile = require('couchdb-compile');
var ensure = require('couchdb-ensure');


module.exports = function push(db, source, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  try {
    db = (typeof db.config === 'object') ? db : nano(db);
  } catch(e) {
    return callback({ error: 'invalid_db', reason: 'Not a valid database: ' + url });
  }

  if (!db.config.db) {
    return callback({ error: 'no_db', reason: 'Not a database: ' + db });
  }

  function pushDoc(doc, attachments) {
    if (options.multipart && attachments.length) {
      db.multipart.insert(doc, attachments, doc._id, callback);
    } else {
      db.insert(doc, doc._id, callback);
    }
  }

  function diffAttachment(attachment, existingAttachment) {
    if (!existingAttachment) {
      return false;
    }

    var md5sum = crypto.createHash('md5');
    var data = options.multipart ? attachment.data : new Buffer(attachment.data, 'base64');
    md5sum.update(data);
    var digest = 'md5-' + md5sum.digest('base64');

    return existingAttachment.digest === digest;
  }

  function diffDoc(doc, existingDoc, attachments) {
    doc._rev = existingDoc._rev;

    if (options.multipart) {
      if (attachments.length) {
        for (var i = 0; i < attachments.length; i++) {
          var name = attachments[i].name;
          var identical = diffAttachment(attachments[i], existingDoc && existingDoc._attachments && existingDoc._attachments[name]);

          if (identical) {
            doc._attachments = doc._attachments || {};
            doc._attachments[name] = existingDoc._attachments[name];
            attachments.splice(i--, 1);
          }
        };
      }
    } else {
      if (doc._attachments) {
        Object.keys(doc._attachments).forEach(function(name) {
          var identical = diffAttachment(doc._attachments[name], existingDoc && existingDoc._attachments && existingDoc._attachments[name]);

          if (identical) {
            doc._attachments[name] = existingDoc._attachments[name];
          }
        });
      }
    }

    try {
      assert.deepEqual(doc, existingDoc);
      if (options.multipart) {
        assert.equal(attachments.length, 0);
      }

      callback(null, { ok: true, id: doc._id, rev: doc._rev, unchanged: true });
    } catch(e) {
      pushDoc(doc, attachments);
    }
  }

  function getDoc(doc, attachments) {
    db.get(doc._id, function(err, response) {
      if (err && err.statusCode === 404) {
        return pushDoc(doc, attachments);
      }

      diffDoc(doc, response, attachments);
    })
  }

  
  function compileDoc() {
    compile(source, options, function(err, doc, attachments) {
      if (err) {
        return callback(err);
      }

      if (!doc._id) {
        return callback({ error: 'missing_id', reason: 'Missing _id property' });
      }

      attachments = attachments || [];

      getDoc(doc, attachments);
    });
  }


  ensure(db, function(error) {
    if (error) {
      return callback(error);
    }
    
    compileDoc();
  });
};
