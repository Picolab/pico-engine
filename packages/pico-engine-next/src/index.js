const express = require('express')
const leveldown = require('leveldown')
const path = require('path')
const { PicoFramework } = require('pico-framework')
const bodyParser = require('body-parser')
const engineVersion = require('../package.json').version

function mergeGetPost (req) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers })
}

module.exports = async function (conf) {
  conf.log_path = path.resolve(conf.home, 'pico-engine.log')

  const pf = new PicoFramework({
    leveldown: leveldown(path.join(conf.home, 'db'))
  })
  await pf.start()

  console.log(`Pico Engine ${engineVersion}`)
  console.log(conf)

  const app = express()
  app.use(express.static(path.resolve(__dirname, '..', 'public')))
  app.use(bodyParser.json({ type: 'application/json' }))
  app.use(bodyParser.urlencoded({ limit: '512mb', type: 'application/x-www-form-urlencoded', extended: false }))

  app.all('/c/:eci/event/:domain/:name', function (req, res, next) {
    pf.event({
      eci: req.params.eci,
      domain: req.params.domain,
      name: req.params.name,
      data: { attrs: mergeGetPost(req) }
    })
      .then(function (data) {
        res.json(data)
      })
      .catch(next)
  })

  // app.all('/c/:eci/query/:rid/:name', function (req, res, next) {
  // })
}
