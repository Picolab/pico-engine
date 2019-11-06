require('util.promisify/shim')()
let PicoEngineCore = require('pico-engine-core')
let leveljs = require('level-js')
let levelup = require('levelup')
let fs = require('fs')
let krlCompiler = require('krl-compiler')
let krlCompilerVersion = require('krl-compiler/package.json').version
let crypto = require('crypto')

/* eslint-disable */
let builtInRulesets = [
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
/* eslint-enable */

window.PicoEngine = async function PicoEngine (dbName, cacheDbName) {
  dbName = dbName || 'pico-engine'
  cacheDbName = cacheDbName || (dbName + '-ruleset-cache')

  let cacheDB = levelup(leveljs(cacheDbName))

  async function compileAndLoadRuleset (rsInfo) {
    let shasum = crypto.createHash('sha256')
    shasum.update(rsInfo.src)
    let hash = shasum.digest('hex')
    let key = krlCompilerVersion + '-' + hash

    let jsSrc
    try {
      let data = await cacheDB.get(key)
      jsSrc = data.toString()
    } catch (err) {
      if (!err.notFound) {
        throw err
      }
    }
    if (!jsSrc) {
      jsSrc = krlCompiler(rsInfo.src, {
        inline_source_map: true
      }).code
      await cacheDB.put(key, jsSrc)
    }

    return eval(jsSrc)// eslint-disable-line no-eval
  }

  let pe = PicoEngineCore({
    host: 'browser',
    db: {
      db: leveljs(dbName)
    },
    // RIDs that will be automatically installed on the root pico
    rootRIDs: [
      'io.picolabs.wrangler',
      'io.picolabs.visual_params',
      'io.picolabs.subscription'
    ],
    compileAndLoadRuleset: compileAndLoadRuleset
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
