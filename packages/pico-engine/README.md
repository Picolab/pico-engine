# pico-engine

[![build status](https://secure.travis-ci.org/Picolab/pico-engine.svg)](https://travis-ci.org/Picolab/pico-engine)
[![windows build status](https://ci.appveyor.com/api/projects/status/cxnk24jb697a9m5b?svg=true)](https://ci.appveyor.com/project/farskipper/pico-engine)

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

## CLI
### Configuration
The server is configured via some environment variables.

 * `PORT` - what port the http server should listen on. By default it's `8080`
 * `PICO_ENGINE_HOME` - where the database and other files should be stored. By default it's `~/.pico-engine/`

## Contributing

See the repository [root readme](https://github.com/Picolab/pico-engine#readme)

## Changelog

To view details about versions: [CHANGELOG.md](https://github.com/Picolab/pico-engine/blob/master/CHANGELOG.md)

## License
MIT
