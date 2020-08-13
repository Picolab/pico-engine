var _ = require('lodash')
var ip = require('ip')
var path = require('path')
var mkdirp = require('mkdirp')
var readPkgUp = require('read-pkg-up')
var PicoEngine = require('../')
var cliCommands = require('./cliCommands')

// parse the CLI args
var args = require('minimist')(process.argv.slice(2), {
  'boolean': [
    'help',
    'version'
  ],
  'alias': {
    'help': 'h'
  }
})
main(args)

function main (args) {
  if (args.help) {
    console.log('')
    console.log('USAGE')
    console.log('')
    console.log('    pico-engine [--version] [--help|-h] <command>')
    console.log('')
    console.log('Commands:')
    console.log('    run                   this is the default')
    console.log('    conf                  print out the configuration')
    console.log('    schedule:list         list all the scheduled events')
    console.log('    schedule:remove <id>  delete a given scheduled event')
    console.log('    schedule:remove all   delete all scheduled events')
    // TODO          db-dump <out-file>    dumps the db into a given json file, or stdout if no file is given
    // TODO          krl-dump              extract all krl files in the db
    console.log('')
    console.log('Environment variables')
    console.log("    PORT - The port the http server should listen on. By default it's 8080")
    console.log("    PICO_ENGINE_HOME - Where the database and other files should be stored. By default it's ~/.pico-engine/")
    console.log("    PICO_ENGINE_HOST - The public url prefix to reach this engine. This is the `meta:host` value in KRL. By default it's http://localhost:8080")
    console.log('')
    return
  }
  if (args.version) {
    console.log(require('../package.json').version)
    return
  }

  /// /////////////////////////////////////////////////////////////////////////////
  // setup the configuration
  var conf = {}

  // get the conf from the nearest package.json
  var pkgup = readPkgUp.sync()
  var pconf = _.get(pkgup, ['pkg', 'pico-engine'], {})

  conf.port = _.isFinite(pconf.port)
    ? pconf.port
    : process.env.PORT || 8080

  conf.host = _.isString(pconf.host)
    ? pconf.host
    : process.env.PICO_ENGINE_HOST || null

  if (!_.isString(conf.host)) {
    conf.host = 'http://' + ip.address() + ':' + conf.port
  }

  conf.home = _.isString(pconf.home)
    ? pconf.home
    : process.env.PICO_ENGINE_HOME || null

  if (!_.isString(conf.home)) {
    conf.home = require('home-dir')('.pico-engine')
  }

  // make the home dir if it doesn't exist
  mkdirp.sync(conf.home)

  conf.modules = {}
  _.each(pconf.modules, function (modPath, id) {
    if (!_.isString(modPath)) {
      throw new Error('Module "' + id + '" require path must be a string')
    }
    if (modPath[0] === '.') {
      modPath = path.resolve(path.dirname(pkgup.path), modPath)
    }
    conf.modules[id] = require(modPath)
  })

  var command = (args._ && args._[0]) || 'run'
  if (cliCommands[command]) {
    cliCommands[command](conf, args)
    return
  }
  if (command !== 'run') {
    console.error('Invalid command: ' + command)
    return
  }
  /// /////////////////////////////////////////////////////////////////////////////
  // start it up
  PicoEngine(conf)
    .catch(function (err) {
      console.error('Failed to start pico-engine')
      throw err
    })
}
