# krl-generator

[![build status](https://secure.travis-ci.org/Picolab/node-krl-generator.svg)](https://travis-ci.org/Picolab/node-krl-generator)

Generate KRL code given krl-ast as input.

See [krl-parser](https://github.com/Picolab/node-krl-parser) for the AST specification.

## Example
Let's make a KRL pretty printer (code re-formatter):
```js
var parser = require('krl-parser');
var generator = require('krl-generator');

var src_ugly = ...//somehow get your krl string

var ast = parser(src_ugly);//parse the ugly code to get the ast

var src_pretty = generator(ast);
//Ta-da!
```

## API

### src = generator(ast[, options])
 * `options.indent` - the string to be used for 1 level of indentation (default `"  "` - 2 spaces).

## License
MIT
