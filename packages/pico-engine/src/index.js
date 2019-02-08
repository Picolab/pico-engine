var path = require('path')
var bunyan = require('bunyan')
var startCore = require('./startCore')
var setupServer = require('./setupServer')

module.exports = async function (conf) {
  conf.log_path = path.resolve(conf.home, 'pico-engine.log')

  var bunyanLog = bunyan.createLogger({
    name: 'pico-engine',
    streams: [{
      type: 'rotating-file',
      level: 'debug',
      path: conf.log_path,
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

  const app = setupServer(pe, conf)

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
