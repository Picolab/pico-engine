require('util.promisify/shim')()
var PicoEngineCore = require('pico-engine-core')
var leveljs = require('level-js')
var fs = require('fs')

var builtInRulesets = [
  {
    src: fs.readFileSync(__dirname + '/../../pico-engine/krl/io.picolabs.wrangler.krl', 'utf8'),
    meta: { url: 'pico-engine.js/io.picolabs.wrangler.krl' }
  },
  {
    src: fs.readFileSync(__dirname + '/../../pico-engine/krl/io.picolabs.visual_params.krl', 'utf8'),
    meta: { url: 'pico-engine.js/io.picolabs.visual_params.krl' }
  },
  {
    src: fs.readFileSync(__dirname + '/../../pico-engine/krl/io.picolabs.subscription.krl', 'utf8'),
    meta: { url: 'pico-engine.js/io.picolabs.subscription.krl' }
  }
]

window.PicoEngine = async function PicoEngine (name) {
  var pe = PicoEngineCore({
    host: 'browser',
    db: {
      db: leveljs(name || 'pico-engine')
    },
    // RIDs that will be automatically installed on the root pico
    rootRIDs: [
      'io.picolabs.wrangler',
      'io.picolabs.visual_params',
      'io.picolabs.subscription'
    ]
  })

  await pe.start(builtInRulesets)

  let rootEci = await pe.getRootECI()

  let myself = await pe.runQuery({
    eci: rootEci,
    rid: 'io.picolabs.wrangler',
    name: 'myself'
  })

  if (myself.eci !== rootEci) {
    await pe.signalEvent({
      eci: rootEci,
      eid: '19',
      domain: 'wrangler',
      type: 'root_created',
      attrs: {
        eci: rootEci
      }
    })
    await pe.signalEvent({
      eci: rootEci,
      eid: '31',
      domain: 'visual',
      type: 'update',
      attrs: {
        dname: 'Root Pico',
        color: '#87cefa'
      }
    })
  }

  return pe
}
