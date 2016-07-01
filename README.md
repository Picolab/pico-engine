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
