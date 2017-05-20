# pico-engine

[![build status](https://secure.travis-ci.org/Picolab/node-pico-engine.svg)](https://travis-ci.org/Picolab/node-pico-engine)
[![windows build status](https://ci.appveyor.com/api/projects/status/nmhdhtqa1n83aqc1?svg=true)](https://ci.appveyor.com/project/farskipper/node-pico-engine)

An implementation of the [pico-engine](http://www.windley.com/archives/2016/03/rebuilding_krl.shtml) hosted on node.js

## Getting Started

### Installing

You'll need [node.js](https://nodejs.org/) v4 or later.
 * Windows - use the installer at [nodejs.org](https://nodejs.org/en/download/)
 * Mac - use the installer at [nodejs.org](https://nodejs.org/en/download/) or use [n bash script](https://github.com/tj/n)
 * Linux - we recommend the [n bash script](https://github.com/tj/n) which will allow you to easily install and switch between node versions.

Once you have node installed, use npm to install the `pico-engine`;

```sh
$ npm install -g pico-engine
```
Now your system has a new command called `pico-engine`.

To start the engine simply run this command
```sh
$ pico-engine
http://localhost:8080
```
Copy the url into a browser and see the UI.

### Bootstrap
The first time you run the system it will create a root Pico and install two rulesets.

There are two rulesets used by all Picos:
 * `io.picolabs.pico` is used by each Pico to keep track of itself and its children
 * `io.picolabs.visual_params` is used by each Pico to keep track of it in the My Picos page
 
### Using the My Picos page

With the rulesets installed, you can drag the rounded rectangle of your Pico and drop it
wherever you want it. In its "About" tab (click on it to reveal the tabs) you can change its
display name and color.

Also in the "About" tab, you can add and delete child Picos.

In the "Rulesets" tab you can see the information held for your Pico by each of its rulesets.
By clicking on a ruleset id,
you will be taken to the Engine Rulesets page
where you can see its source code.

To make your own ruleset, write your code in the box in the
Engine Rulesets page.
Use the "validate" button until the code compiles.
Then use the "register" button to register this version
of your code with the engine.
Use the "enable" button to enable this version,
and the "install" button to have the engine save away
the compiled code for use.

## CLI
### Configuration
The server is configured via some environment variables.

 * `PORT` - what port the http server should listen on. By default it's `8080`
 * `PICO_ENGINE_HOME` - where the database and other files should be stored. By default it's `~/.pico-engine/`

## Contributing

The `pico-engine` is made up of several smaller modules. Each with their own documentation and test suite.
 * [pico-engine-core](https://github.com/Picolab/node-pico-engine-core) - executes compiled KRL
 * [krl-stdlib](https://github.com/Picolab/node-krl-stdlib) - standard library for KRL
 * [krl-compiler](https://github.com/Picolab/node-krl-compiler) - compiles AST into a JavaScript module
 * [krl-parser](https://github.com/Picolab/node-krl-parser) - parses KRL to produce an abstract syntax tree (AST)
 * [krl-generator](https://github.com/Picolab/node-krl-generator) - generates KRL from an AST (pretty-printer)

To run the pico-engine in development mode do the following:

```sh
$ git clone https://github.com/Picolab/node-pico-engine.git
$ cd node-pico-engine
$ npm install
$ npm start
```

That will start the server and run the test. Anytime you make a change in the `src/` folder it will restart the server and re-run the tests.

NOTE: When running via `npm start` the `PICO_ENGINE_HOME` will default to your current directory i.e. your clone of this repository.

## Changelog

To view details about versions: [CHANGELOG.md](https://github.com/Picolab/node-pico-engine/blob/master/CHANGELOG.md)

## License
MIT
