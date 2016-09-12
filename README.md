# pico-engine

[![build status](https://secure.travis-ci.org/Picolab/node-pico-engine.svg)](https://travis-ci.org/Picolab/node-pico-engine)

A prototype implementation of the [pico-engine](http://www.windley.com/archives/2016/03/rebuilding_krl.shtml) written in node.js

## CLI
To run the pico-engine on your machine simply do the following:
```sh
$ npm install -g pico-engine
$ pico-engine
```

### Configuration
The server is configured via some environment variables.

 * `PORT` - what port the http server should listen on. By default it's `8080`
 * `PICO_ENGINE_HOME` - where the database and other configuration files should be stored. By default it's `~/.pico-engine/`

## License
MIT

## Starting the pico-engine

Alternate technique for installaing the pico-engine,
appropriate for those who wish to contribute
improvements:

Install by:
 * `git clone https://github.com/Picolab/node-pico-engine`
 * `npm install`

Start with:
 * `npm start`

## UI
Once you have started the pico-engine, 
there is a web server running on your local machine.

## Bootstrap
Visit the Pico Bootstrap page at `localhost:8080`
(assuming you use the default PORT).
As it loads, the page will automatically perform
all the operations necessary to
create a root Pico and install two rulesets.

There are two rulesets used by all Picos:
 * `io.picolabs.pico` is used by each Pico to keep track of itself and its children
 * `io.picolabs.visual_params` is used by each Pico to keep track of it in the My Picos page
 
## Using the My Picos page

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
