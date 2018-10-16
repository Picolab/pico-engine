var path = require('path')
var bunyan = require('bunyan')
var startCore = require('./startCore')
var setupServer = require('./setupServer')

module.exports = function (conf) {
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

  console.log('          ██████╗ ██╗ ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗ \n          ██╔══██╗██║██╔════╝██╔═══██╗██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝ \n          ██████╔╝██║██║     ██║   ██║█████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗   \n          ██╔═══╝ ██║██║     ██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝   \nStarting  ██║     ██║╚██████╗╚██████╔╝███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗ ' + require('../package.json').version + '\n          ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝ ')
  console.log(conf)
  bunyanLog.info({ conf: conf }, '          ██████╗ ██╗ ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗ \n          ██╔══██╗██║██╔════╝██╔═══██╗██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝ \n          ██████╔╝██║██║     ██║   ██║█████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗   \n          ██╔═══╝ ██║██║     ██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝   \nStarting  ██║     ██║╚██████╗╚██████╔╝███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗ ' + require('../package.json').version + '\n          ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝ ')

  conf.bunyanLog = bunyanLog

  startCore(conf).then(function (pe) {
    var app = setupServer(pe)
    // signal engine started
    pe.getRootECI(function (error, rootEci) {
      if (error) {}
      pe.signalEvent({
        eid: '12345',
        eci: rootEci,
        domain: 'system',
        type: 'online',
        attrs: {}
      }, function (err, response) { if (err) {} })
    })
    app.listen(conf.port, function () {
      console.log(conf.host)
      bunyanLog.info('HTTP server listening on port ' + conf.port)
    })
  }, function (err) {
    throw err
  })
}
