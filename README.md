# pico-engine

[![Node version](https://img.shields.io/node/v/pico-engine.svg)](https://nodejs.org/en/download/)
[![Build Status](https://github.com/Picolab/pico-engine/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/Picolab/pico-engine/actions/workflows/test.yml)

An implementation of the [pico-engine](http://www.windley.com/archives/2016/03/rebuilding_krl.shtml) hosted on node.js

## Getting Started / Installing / Configuration

See [packages/pico-engine](https://github.com/Picolab/pico-engine/tree/master/packages/pico-engine#readme)
for detailed step-by-step instructions to get started.

## Contributing

This section is for those who want to contribute to the `pico-engine` source code.
KRL programmers would be better off following the link in the previous section.

The `pico-engine` is made up of several smaller modules. Each with their own documentation and test suite.

However they live in this repository in the `packages/` directory (mono-repo style using [lerna](https://github.com/lerna/lerna))
 * **pico-engine** - this is the npm package people install and use
 * **pico-engine-core** - executes compiled KRL and manages event life-cycle
 * **pico-engine-ui** - the default UI of pico-engine
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

**Building the UI:** `npm run build` at the repo root compiles the engine packages only. After changing `pico-engine-ui`, run `cd packages/pico-engine-ui && npm run build` to copy the bundle into `packages/pico-engine/public/`.

**NOTE about dependencies:** generally don't use `npm i`, rather use `npm run setup` from the root. [lerna](https://github.com/lerna/lerna) will link up the packages so when you make changes in one package, it will be used in others.

**pico-engine 1.6** requires **pico-framework `^0.8.1`** (publish framework before engine). For co-development with a sibling `pico-framework` clone, use `npm run link-framework` from the repo root — not needed for normal `npm install` deployments.


### Working in sub-package

Each sub-package has it's own tests. And the `npm start` command is wired to watch for file changes and re-run tests when you make changes.  For example, to make changes to the parser:

```sh
$ cd packages/krl-parser/
$ npm start
```

NOTE: When running via `npm start` the `PICO_ENGINE_HOME` will default to your current directory i.e. your clone of this repository.

### Making changes

Use a branch (or fork) to do your work. When you are ready, create a pull request. That way we can review it before merging it into master.

The Pico Labs documentation has a page inviting contributions and giving a step-by-step example, at [Pico Engine welcoming your contributions](https://picolabs.atlassian.net/wiki/spaces/docs/pages/704675843/Pico+Engine+welcoming+your+contributions).

## Changelog

To view details about versions: [CHANGELOG.md](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)

**1.6:** Layer 2 identity (**did:webvh** for intros, **did:peer** for relationship traffic), DID-based relationships, and cross-engine SKY/DIDComm. Requires **pico-framework ^0.8.1**. See [docs/guides/layer2-subscriptions.md](docs/guides/layer2-subscriptions.md) and [docs/release/1.6.md](docs/release/1.6.md).

**1.6.2+:** Developer UI **Relationships** tab (legacy *subscription* KRL names still work). **1.6.3:** outbound pending cancel fix; block self-relationships.

## License
MIT
