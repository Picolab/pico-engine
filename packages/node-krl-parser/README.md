# krl-parser

[![build status](https://secure.travis-ci.org/Picolab/node-krl-parser.svg)](https://travis-ci.org/Picolab/node-krl-parser)

Parse KRL source code into an AST

## Usage
```js
var parser = require('krl-parser');

var src = ...//somehow get your krl string

var ast = parser(src);
```

## AST Specification
The specification is found in [spec.md](https://github.com/Picolab/node-krl-parser/blob/master/spec.md)

## API
### ast = parser(src[, options])
 * `src` - your krl source code string
 * `options.filename` - If provided, it will be used on parsing errors so the user know what file failed to parse.

This function will throw errors when it can't parse. When applicable, the Error object may have a `where` property. i.e.
```js
var src = 'function(a, b] { a + b }';
try{
  ast = parser(src, {filename: 'bad-function.krl'});
}catch(err){
  console.log(err.where);
}
```
```js
{ filename: 'bad-function.krl',
  line: 1,
  col: 14,
  excerpt: 'function(a, b] { a + b }\n             ^' }
```

### name = extractRulesetName(src)
 * `src` - your krl source code string

This function return the ruleset name. Or `undefined` if it's unable to parse it. This is handy when you need the ruleset name without the overhead of parsing the entire file.
```js
var extractRulesetName = require('krl-parser/src/extractRulesetName');

name = extractRulesetName('ruleset blah { ... }');
//-> "blah"
```

## Developing

The parser is built using [nearley](https://www.npmjs.com/package/nearley). It uses the Earley parser algorithm.

The KRL grammar is defined here: [src/grammar.ne](https://github.com/Picolab/node-krl-parser/blob/master/src/grammar.ne)

When developing run this:
```sh
$ npm start
```
It will watch for file changes, rebuild the grammar and run tests.

To rebuild and run tests once, run this:
```sh
$ npm test
```

Sometimes you may unwittingly introduce an ambiguity into the grammar. Run this script to help you find it:
```sh
$ node tests/ambiguityFinder.js
```
It will generate and try to parse random KRL programs (using [KaRL42](https://www.npmjs.com/package/karl42). When it finds an ambiguity it will stop and diff the outputs to help you spot the ambiguity.

## License
MIT
