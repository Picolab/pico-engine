# krl-parser

[![Build Status](https://travis-ci.org/Picolab/pico-engine.svg?branch=master)](https://travis-ci.org/Picolab/pico-engine)

Parse KRL source code into an AST

## Usage

```js
var parser = require('krl-parser');

var src = ...//somehow get your krl string

var ast = parser(src);
```

## AST Specification

A simple specification is found in [spec.md](https://github.com/Picolab/pico-engine/blob/master/packages/krl-parser/spec.md)

The AST type definitions are found in [types.ts](https://github.com/Picolab/pico-engine/blob/master/packages/krl-parser/src/types.ts)

## API

### ast = parser(src[, options])

- `src` - your krl source code string
- `options.filename` - If provided, it will be used on parsing errors so the user know what file failed to parse.

This function will throw errors when it can't parse. When applicable, the Error object may have a `where` property. i.e.

```js
var src = "function(a, b] { a + b }";
try {
  ast = parser(src, { filename: "bad-function.krl" });
} catch (err) {
  console.log(err.where);
}
```

```js
{ filename: 'bad-function.krl',
  line: 1,
  col: 14,
  excerpt: 'function(a, b] { a + b }\n             ^' }
```

## Developing

The technique used for this implementation is [Top Down Operator Precedence](http://crockford.com/javascript/tdop/tdop.html), also called a [Pratt parser](https://en.wikipedia.org/wiki/Pratt_parser).

When developing run this:

```sh
$ npm start
```

It will watch for file changes, rebuild the grammar and run tests.

To run tests once, run this:

```sh
$ npm test
```

To compile typescript, run this:

```sh
$ npm run build
```

## License

MIT
