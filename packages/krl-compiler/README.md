# krl-compiler

[![Build Status](https://travis-ci.org/Picolab/pico-engine.svg?branch=master)](https://travis-ci.org/Picolab/pico-engine)

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

```
USAGE
    krl-compiler [--verify] [--no-source-map] [--help, -h]

DESCRIPTION
    Take krl as stdin and will give js as stdout
    $ krl-compiler < in.krl > out.js

OPTIONS
    --no-source-map
        Don't append an inline source map in the output

    --verify
        On valid compilation silently exit with 0
        On failure write the error to stdout and exit with 1

    --version, -v
        output the version

    --help, -h
        Display this message

```

## License
MIT
