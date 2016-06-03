# krl-compiler

[![build status](https://secure.travis-ci.org/farskipper/node-krl-compiler.svg)](https://travis-ci.org/farskipper/node-krl-compiler)

[KRL](http://picolabs.io/) to javascript compiler.

## API
```js
var compile = require('krl-compiler');

var js_string = compile(krl_string);

//it can also take an ast as input
var js_string = compile(krl_ast);
```
Note, this function is synchronous (since there is no I/O) and will throw errors when needed.

## CLI
The compiler can be used via shell. It takes KRL code in `stdin` and write the javascript code to `stdout`.
```sh
$ npm install -g krl-compiler
$ krl-compiler < in.krl > out.js
```

## License
MIT
