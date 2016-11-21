// couchdb-push
// (c) 2014 Johannes J. Schmidt

var crypto = require('crypto')
var async = require('async')
var omit = require('lodash/omit')
var isEqual = require('lodash/isEqual')
var nanoOption = require('nano-option')
var compile = require('couchdb-compile')
var ensure = require('couchdb-ensure')
var chokidar = require('chokidar')

module.exports = function push (db, source, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options = options || {}

  try {
    db = nanoOption(db)
  } catch (e) {
    return callback({ error: 'invalid_db', reason: 'Not a valid database: ' + db })
  }

  if (!db.config.db) {
    return callback({ error: 'no_db', reason: 'Not a database: ' + db })
  }

  function pushDoc (doc, attachments, done) {
    if (options.multipart && attachments.length) {
      db.multipart.insert(doc, attachments, doc._id, done)
    } else {
      db.insert(doc, doc._id, done)
    }
  }

  function diffAttachment (attachment, existingAttachment) {
    if (!existingAttachment) {
      return false
    }

    var md5sum = crypto.createHash('md5')
    var data = options.multipart ? attachment.data : new Buffer(attachment.data, 'base64')
    md5sum.update(data)
    var digest = 'md5-' + md5sum.digest('base64')

    return existingAttachment.digest === digest
  }

  function diffDoc (doc, existingDoc, attachments, done) {
    doc._rev = existingDoc._rev

    if (options.multipart) {
      if (attachments.length) {
        for (var i = 0; i < attachments.length; i++) {
          var name = attachments[i].name
          var identical = diffAttachment(attachments[i], existingDoc && existingDoc._attachments && existingDoc._attachments[name])

          if (identical) {
            doc._attachments = doc._attachments || {}
            doc._attachments[name] = existingDoc._attachments[name]
            attachments.splice(i--, 1)
          }
        }
      }
    } else {
      if (doc._attachments) {
        Object.keys(doc._attachments).forEach(function (name) {
          var identical = diffAttachment(doc._attachments[name], existingDoc && existingDoc._attachments && existingDoc._attachments[name])

          if (identical) {
            doc._attachments[name] = existingDoc._attachments[name]
          }
        })
      }
    }

    // cannot diff multipart attachments
    if (options.multipart && attachments.length > 0) {
      return pushDoc(doc, attachments, done)
    }

    hasChanged(doc, existingDoc, function (error, changed) {
      if (error) return done(error)

      if (changed) return pushDoc(doc, attachments, done)

      done(null, {
        ok: true,
        id: doc._id,
        rev: doc._rev,
        unchanged: true
      })
    })
  }

  function hasChanged (doc, existingDoc, callback) {
    if (isUserDoc(doc) && doc.name && doc.password) {
      confirmSession(doc.name, doc.password, function (error, result) {
        if (error) {
          if (error.statusCode === 401) return callback(null, true)
          return callback(error)
        }

        var userDocToCompare = omit(doc, 'password')
        var existingDocToCompare = omit(existingDoc, 'derived_key', 'iterations', 'password_scheme', 'salt')

        callback(null, !isEqual(userDocToCompare, existingDocToCompare))
      })
    } else {
      callback(null, !isEqual(doc, existingDoc))
    }
  }

  // TChecking against `_users` is not acurate, because the users db can be configured:
  // [couch_httpd_auth]
  // authentication_db = _users
  function isUserDoc (doc) {
    return db.config.db === '_users'
  }

  function confirmSession (name, password, done) {
    db.auth(name, password, done)
  }

  function getDoc (doc, attachments, done) {
    db.get(doc._id, function (err, response) {
      if (err && err.statusCode === 404) {
        return pushDoc(doc, attachments, done)
      }

      diffDoc(doc, response, attachments, done)
    })
  }

  function compileDoc (done) {
    compile(source, options, function (err, doc, attachments) {
      if (err) {
        return done(err)
      }

      if (!doc._id) {
        return done({ error: 'missing_id', reason: 'Missing _id property' })
      }

      attachments = attachments || []

      getDoc(doc, attachments, done)
    })
  }

  ensure(db, function (error) {
    if (error) {
      return callback(error)
    }

    if (options.watch) {
      var queue = async.queue(function (task, done) {
        compileDoc(function (error, response) {
          error ? console.error(error)
            : console.log(JSON.stringify(response, null, '  '))
          done(error)
        })
      }, 1)

      chokidar
        .watch(source, { ignoreInitial: true, awaitWriteFinish: true })
        .on('all', function () {
          queue.push(true)
        })
    }

    compileDoc(callback)
  })
}
