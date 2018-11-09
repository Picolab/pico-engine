var path = require('path')
var bunyan = require('bunyan')
var startCore = require('./startCore')
var setupServer = require('./setupServer')

module.exports = async function (conf) {
  var bunyanLog = bunyan.createLogger({
    name: 'pico-engine',
    streams: [{
      type: 'rotating-file',
      level: 'debug',
      path: path.resolve(conf.home, 'pico-engine.log'),
      period: '1w', // rotate every week
      count: 12// keep up to 12 weeks of logs
    }]
  })

  console.log(`
         ██████╗ ██╗ ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗
         ██╔══██╗██║██╔════╝██╔═══██╗██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝
         ██████╔╝██║██║     ██║   ██║█████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗
         ██╔═══╝ ██║██║     ██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝
Starting ██║     ██║╚██████╗╚██████╔╝███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗ ${require('../package.json').version}
         ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
`)
  console.log(conf)
  bunyanLog.info({ conf: conf }, 'Starting PicoEngine ' + require('../package.json').version)

  conf.bunyanLog = bunyanLog

  const pe = await startCore(conf)

  const app = setupServer(pe)

  // start http server
  await new Promise(resolve => app.listen(conf.port, resolve))
  console.log(conf.host)
  bunyanLog.info('HTTP server listening on port ' + conf.port)

  // signal system:online
  const rootEci = await pe.getRootECI()
  await pe.signalEvent({
    eci: rootEci,
    domain: 'system',
    type: 'online'
  })

  return pe
}
