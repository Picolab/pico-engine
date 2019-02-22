var test = require('ava')
var mkTestPicoEngine = require('./helpers/mkTestPicoEngine')

test('PicoEngine - consumers of a module should immediately see changes', async function (t) {
  const pe = await mkTestPicoEngine({
    compileAndLoadRuleset: 'inline'
  })

  const krlLib = `ruleset lib {
    meta {
      provides foo
    }
    global {
      foo = "version one"
    }
  }`
  const krlLib2 = `ruleset lib {
    meta {
      provides foo
    }
    global {
      foo = "version TWO"
    }
  }`
  const krlCon = `ruleset con.rid {
    meta {
      use module lib
      shares bar
    }
    global {
      bar = <<using #{lib:foo}>>
    }
  }`

  await pe.newPico({})
  await pe.registerRuleset(krlLib, {})
  await pe.registerRuleset(krlCon, {})
  await pe.installRuleset('id0', 'con.rid')

  let out = await pe.runQuery({
    eci: 'id1',
    rid: 'con.rid',
    name: 'bar'
  })
  t.is(out, 'using version one')

  await pe.registerRuleset(krlLib2, {})

  out = await pe.runQuery({
    eci: 'id1',
    rid: 'con.rid',
    name: 'bar'
  })
  t.is(out, 'using version TWO')
})

test('PicoEngine - consumers of a module should immediately see changes 2 levels', async function (t) {
  const pe = await mkTestPicoEngine({
    compileAndLoadRuleset: 'inline'
  })

  const krlLib = `ruleset lib {
    meta {
      provides foo
    }
    global {
      foo = "version one"
    }
  }`
  const krlLib2 = `ruleset lib {
    meta {
      provides foo
    }
    global {
      foo = "version TWO"
    }
  }`
  const krlCon = `ruleset con {
    meta {
      use module lib
      provides bar
    }
    global {
      bar = <<con using #{lib:foo}>>
    }
  }`
  const krlConCon = `ruleset con.con {
    meta {
      use module con
      shares baz
    }
    global {
      baz = <<concon using #{con:bar}>>
    }
  }`

  await pe.newPico({})
  await pe.registerRuleset(krlLib, {})
  await pe.registerRuleset(krlCon, {})
  await pe.registerRuleset(krlConCon, {})
  await pe.installRuleset('id0', 'con.con')

  let out = await pe.runQuery({
    eci: 'id1',
    rid: 'con.con',
    name: 'baz'
  })
  t.is(out, 'concon using con using version one')

  await pe.registerRuleset(krlLib2, {})

  out = await pe.runQuery({
    eci: 'id1',
    rid: 'con.con',
    name: 'baz'
  })
  t.is(out, 'concon using con using version TWO')
})
