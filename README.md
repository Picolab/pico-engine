# pico-engine

[![Build Status](https://travis-ci.org/Picolab/pico-engine.svg)](https://travis-ci.org/Picolab/pico-engine)
[![Node version](https://img.shields.io/node/v/pico-engine.svg)](https://nodejs.org/en/download/)

An implementation of the [pico-engine](http://www.windley.com/archives/2016/03/rebuilding_krl.shtml) hosted on node.js 

## Getting Started / Installing / Configuration

See [packages/pico-engine](https://github.com/Picolab/pico-engine/tree/master/packages/pico-engine#readme)

## Contributing

The `pico-engine` is made up of several smaller modules. Each with their own documentation and test suite.

However they live in this repository in the `packages/` directory (mono-repo style using [lerna](https://github.com/lerna/lerna))
 * **pico-engine** - this is the npm package people install and use
 * **pico-engine-core** - executes compiled KRL and manages event life-cycle
 * **krl-stdlib** - standard library for KRL
 * **krl-compiler** - compiles AST into a JavaScript module
 * **krl-parser** - parses KRL to produce an abstract syntax tree (String -> AST)
 * **krl-generator** - generates KRL from an AST (AST -> String)
 * **krl-editor** - in browser editor for KRL

To run the pico-engine in development mode do the following:

```sh
$ git clone https://github.com/Picolab/pico-engine.git
$ cd pico-engine
$ npm run setup
$ npm start
```

That will start the server and run the test. `npm start` is simply an alias for `cd packages/pico-engine && npm start`

**NOTE about dependencies:** generally don't use `npm i`, rather use `npm run setup` from the root. [lerna](https://github.com/lerna/lerna) will link up the packages so when you make changes in one package, it will be used in others.


### Working in sub-package

Each sub-package has it's own tests. And the `npm start` command is wired to watch for file changes and re-run tests when you make changes.  For example, to make changes to the parser:

```sh
$ cd packages/krl-parser/
$ npm start
```

NOTE: When running via `npm start` the `PICO_ENGINE_HOME` will default to your current directory i.e. your clone of this repository.

### Making changes

Use a branch (or fork) to do your work. When you are ready, create a pull request. That way we can review it before merging it into master.

View [docs/git-cheatsheet.md](https://github.com/Picolab/pico-engine/blob/master/docs/git-cheatsheet.md) for more.

The Pico Labs documentation has a page inviting contributions and giving a step-by-step example, at [Pico Engine welcoming your contributions](https://picolabs.atlassian.net/wiki/spaces/docs/pages/704675843/Pico+Engine+welcoming+your+contributions).

## Changelog

To view details about versions: [CHANGELOG.md](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)

## License
MIT
