# CouchDB Push
Deploy CouchDB documents from directory, JSON or CommonJS module.
Via API or command line client.

[![Build
Status](https://travis-ci.org/jo/couchdb-push.svg?branch=master)](http://travis-ci.org/jo/couchdb-push)

```js
var push = require('couchdb-push');

push('http://localhost:5984/my-app', 'path/to/couch/app', function(err, resp) {
  // { ok: true }
});
```


## API

```js
push(url, source[, options], callback)
```

* `url` - URL to a CouchDB database. Auth URLs are OK. See [nanos configuration](https://github.com/dscape/nano#configuration), as this argument is
directly passed to nano.
* `source` -  Can be a  Couchapp Directory Tree, JSON file or CommonJS/Node module. Please see [couchdb-compile](https://github.com/jo/couchdb-compile) for in depth information about source handling.
* `options.multipart` - if set to `true`, attachments are saved via [multipart api](http://docs.couchdb.org/en/latest/api/document/common.html#creating-multiple-attachments).
* `callback` - called when done with two arguments: `error` and `response`.


## CLI
```sh
couchdb-bootstrap URL [SOURCE]
```

When `SOURCE` is omitted, the current directory will be used.  
`options.multipart` is always set to true.

### Example

```sh
couchdb-push http://localhost:5984/my-app /path/to/my/couch/app
```

## Tests
```sh
npm test
```

(c) 2014 Johannes J. Schmidt, TF  
MIT License
