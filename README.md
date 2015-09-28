# CouchDB Push
Deploy CouchDB documents from directory, JSON or CommonJS module.
Via API or command line client.

[![Build
Status](https://travis-ci.org/jo/couchdb-push.svg?branch=master)](http://travis-ci.org/jo/couchdb-push)


## API

```js
push(db, source[, options], callback)
```

* `db` - URL to a CouchDB database. Auth URLs are OK. See [nanos configuration](https://github.com/dscape/nano#configuration), as this argument is directly passed to nano. As of v1.5.0 a nano object is supported, too.
* `source` -  Can be a  Couchapp Directory Tree, JSON file or CommonJS/Node module. Please see [couchdb-compile](https://github.com/jo/couchdb-compile) for in depth information about source handling.
* `options.index` - When set to `true`, folders are searched for `index.js`, which, if present, is treated as CommonJS module. Default is `false`.
* `options.multipart` - if set to `true`, attachments are saved via [multipart api](http://docs.couchdb.org/en/latest/api/document/common.html#creating-multiple-attachments).
* `options.watch` - if set to `true`, watch `source` and push on file changes.
* `callback` - called when done with two arguments: `error` and `response`.

### Example

```js
var push = require('couchdb-push');
push('http://localhost:5984/my-app', 'project/couchdb', function(err, resp) {
  // { ok: true }
});
```


## CLI
```sh
couchdb-push DB [SOURCE] [OPTIONS]
```

When `SOURCE` is omitted, the current directory will be used.  
`OPTIONS` can be `--index`, `--multipart` or `--watch`, see above.

### Example

```sh
couchdb-push http://localhost:5984/my-app project/couchdb --watch
```

## Tests
```sh
npm test
```

(c) 2014 Johannes J. Schmidt, TF  
Apache 2.0 License
