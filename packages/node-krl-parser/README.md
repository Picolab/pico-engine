# krl-parser

[![build status](https://secure.travis-ci.org/farskipper/node-krl-parser.svg)](https://travis-ci.org/farskipper/node-krl-parser)

Parse KRL source code into an AST

## Usage
```js
var parser = require('krl-parser');

var src = ...//somehow get your krl string

var ast = parser(src);
```

## AST Specification
The specification is found in [spec.md](https://github.com/farskipper/node-krl-parser/blob/master/spec.md)

## Developing

The parser is built using [nearley](https://www.npmjs.com/package/nearley). It uses the Earley parser algorithm.

The KRL grammar is defined here: [src/grammar.ne](https://github.com/farskipper/node-krl-parser/blob/master/src/grammar.ne)

When developing run this:
```sh
$ npm start
```
It will watch for file changes, rebuild the grammar and run tests.

To rebuild and run tests once, run this:
```sh
$ npm test
```

## License
MIT
