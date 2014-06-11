# couch-push
Deploy CouchDB documents from directory, JSON or module.

[![Build Status](https://travis-ci.org/jo/couch-push.svg?branch=master)](http://travis-ci.org/jo/couch-push)

```js
var push = require('couch-push');
compile('/my/couch/app', 'http://localhost:5984/my-app', function(err, resp) {
  // { ok: true }
});
```

## Usage
```js
push(url, source, [options], callback)
```

### `url`
URL to a CouchDB database. Auth URLs are OK. See
[nanos configuration](https://github.com/dscape/nano#configuration), as this argument is
directly passed to nano.

### `source`
Can be a  Couchapp Directory Tree, JSON file or CommonJS/Node module.
Please see [couch-compile](https://github.com/jo/couch-compile) for in depth
information about source handling.

### `options`
Currently there are supported `options`.

### `callback`
`callback` is called with two arguments: `error` and `response`.

### CLI
```shell
npm install -g couch-push
```

Give it a database and a directory:
```shell
couch-push http://localhost:5984/my-app /path/to/my/couch/app
```

When omitted, the current directory will be used.

## Testing
Run the testsuite with
```shell
npm test
```

(c) 2014 Johannes J. Schmidt, TF  
MIT License
