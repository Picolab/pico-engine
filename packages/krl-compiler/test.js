var _ = require('lodash')
var λ = require('contra')
var fs = require('fs')
var diff = require('diff-lines')
var path = require('path')
var util = require('util')
var test = require('ava')
var compiler = require('./')

var filesDir = path.resolve(__dirname, '../../test-rulesets')

test('compiler', util.promisify(function (t, cb) {
  fs.readdir(filesDir, function (err, files) {
    if (err) return cb(err)

    var basenames = _.uniq(_.map(files, function (file) {
      return path.basename(path.basename(file, '.krl'), '.js')
    })).filter(function (basename) {
      return fs.existsSync(path.join(filesDir, basename + '.js')) &&
        fs.existsSync(path.join(filesDir, basename + '.krl'))
    })

    λ.each(basenames, function (basename, next) {
      var jsFile = path.join(filesDir, basename) + '.js'
      var krlFile = path.join(filesDir, basename) + '.krl'
      λ.concurrent({
        js: λ.curry(fs.readFile, jsFile, 'utf8'),
        krl: λ.curry(fs.readFile, krlFile, 'utf8')
      }, function (err, srcs) {
        if (err) return cb(err)

        var compiled
        try {
          compiled = compiler(srcs.krl.replace(/\r\n?/g, '\n')).code
        } catch (e) {
          console.log(krlFile)
          console.log(e.stack)
          process.exit(1)// end asap, so they can easily see the error
        }
        compiled = compiled.trim()
        var expected = srcs.js.replace(/\r\n?/g, '\n').trim()

        if (compiled === expected) {
          t.true(true)
          next()
        } else {
          console.log('')
          console.log(path.basename(krlFile) + ' -> ' + path.basename(jsFile))
          console.log('')
          console.log(diff(expected, compiled, {
            n_surrounding: 3
          }))
          console.log('')
          console.log(path.basename(krlFile) + ' -> ' + path.basename(jsFile))
          process.exit(1)// end asap, so they can easily see the diff
        }

        next()
      })
    }, cb)
  })
}))

test('rulesetSchema stub in compiled output', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { name "T" description "Test RS" shares ping }',
    '  global {',
    '    /** Pong query. @returns String */',
    '    ping = function() { "pong" }',
    '  }',
    '  /** Opens the app.',
    '   * @attr id String */',
    '  rule open { select when app open }',
    '}'
  ].join('\n')
  var out = compiler(src)
  t.true(out.code.indexOf('__rulesetSchema1') !== -1)
  t.true(out.code.indexOf('"rule": "open"') !== -1)
  t.true(out.code.indexOf('"name": "ping"') !== -1)
  t.true(out.code.indexOf('Opens the app') !== -1)
})

test('rulesetSchema emits and prechecks on annotated rules', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares canGo }',
    '  global { canGo = function() { true } }',
    '  /** Ping. */',
    '  rule ping {',
    '    select when test ping',
    '    if canGo() then every {',
    '      event:send({',
    '        "eci": event:attr("callback_eci"),',
    '        "domain": "community",',
    '        "type": "pong"',
    '      });',
    '    }',
    '    fired { raise wrangler event "done" attributes event:attrs }',
    '  }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  t.deepEqual(op.prechecks, [{ fn: 'canGo', args: {} }])
  t.true(op.emits.some(function (e) {
    return e.via === 'send' && e.domain === 'community' && e.type === 'pong' &&
      e.replyTo === 'callback_eci'
  }))
  t.true(op.emits.some(function (e) {
    return e.via === 'raise' && e.domain === 'wrangler' && e.type === 'done' &&
      e.when.some(function (w) { return w.branch === 'fired' })
  }))
})

test('rulesetSchema prechecks omit non-shared functions in condition', function (t) {
  var src = [
    'ruleset io.test {',
    '  global { isAThing = function(id) { true } }',
    '  /** Update. */',
    '  rule update {',
    '    select when test update',
    '    pre { picoID = event:attr("picoID") }',
    '    if picoID && isAThing(picoID) then every { noop() }',
    '  }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  t.deepEqual(op.prechecks, [])
  t.true(op.condition.indexOf('isAThing') !== -1)
})

test('rulesetSchema prechecks map pre bindings to event attrs', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares isAThing }',
    '  global { isAThing = function(picoID) { true } }',
    '  /** Update. */',
    '  rule update {',
    '    select when test update',
    '    pre { picoID = event:attr("picoID") }',
    '    if picoID && isAThing(picoID) then every { noop() }',
    '  }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  t.deepEqual(op.prechecks, [{
    fn: 'isAThing',
    args: { picoID: { attr: 'picoID' } }
  }])
})

test('rulesetSchema meta description unwraps chevron strings', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta {',
    '    description <<The hub.',
    '      More detail.>>',
    '    shares ping',
    '  }',
    '  global { /** q */ ping = function() { 1 } }',
    '}'
  ].join('\n')
  var out = require('./src/schemaFromSource')(src)
  t.is(out.rulesetSchema.description, 'The hub.\nMore detail.')
  t.false(out.rulesetSchema.description.includes('<<'))
})

test('rulesetSchema rid_version from meta or draft default', function (t) {
  var out = require('./src/schemaFromSource')(
    'ruleset io.test { meta { version "2.1.0" shares ping } global { /** q */ ping = function() { 1 } } }'
  )
  t.is(out.rulesetSchema.rid_version, '2.1.0')
  var draft = require('./src/schemaFromSource')(
    'ruleset io.test { meta { shares ping } global { /** q */ ping = function() { 1 } } }'
  )
  t.is(draft.rulesetSchema.rid_version, 'draft')
})

test('krl check reports unused @attr', function (t) {
  var src = [
    'ruleset io.test {',
    '  /**',
    '   * Bad.',
    '   * @attr missing String',
    '   */',
    '  rule r { select when test ping if true then every { noop() } }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.true(out.warnings.some(function (w) {
    return w.message.indexOf('@attr missing') !== -1
  }))
})

test('krl check ignores /** on unshared helper (JSDoc @returns does not fail compile)', function (t) {
  var src = [
    'ruleset io.test {',
    '  global {',
    '    /** Hidden helper. @returns String */',
    '    helper = function() { "x" }',
    '  }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.false(out.warnings.some(function (w) {
    return w.message.indexOf('helper') !== -1 &&
      w.message.indexOf('shares or provides') !== -1
  }))
})

test('krl check no warn when annotated function is in provides', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { provides helper }',
    '  global {',
    '    /** Module export. @returns String */',
    '    helper = function() { "x" }',
    '  }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.false(out.warnings.some(function (w) {
    return w.message.indexOf('helper') !== -1 &&
      w.message.indexOf('shares or provides') !== -1
  }))
})

test('krl check errors on bad @param', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares f }',
    '  global {',
    '    /** @param nope String @returns Any */',
    '    f = function() { null }',
    '  }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.false(out.ok)
})

test('rulesetSchema omitted when no annotations', function (t) {
  var src = 'ruleset io.test { rule r { select when a b } }'
  var out = compiler(src)
  t.is(out.code.indexOf('__rulesetSchema1'), -1)
})

test('compiler errors', function (t) {
  var tstFail = function (src, errorMsg) {
    try {
      compiler(src)
      t.fail('Should fail: ' + errorMsg)
    } catch (err) {
      t.is(err + '', errorMsg)
    }
  }

  var tstWarn = function (src, warning) {
    var out = compiler(src)
    t.is(out.warnings.length, 1)
    t.is(out.warnings[0].message, warning)
  }
  try {
    compiler('ruleset blah {global {ent:a = 1}}\n')
    t.fail('should have thrown up b/c ent:* = * not allowed in global scope')
  } catch (err) {
    t.true(true)
  }

  try {
    compiler('function(){a = 1}')
    t.fail('function must end with an expression')
  } catch (err) {
    t.is(err + '', 'ParseError: Expected the function return expression')
  }

  try {
    compiler('ruleset a{meta{keys b {"one":function(){null}}}}')
    t.fail('meta key maps can only have strings')
  } catch (err) {
    t.is((err + '').split('\n')[0], 'Error: RulesetMetaProperty not supported: keys')
  }

  tstFail(
    'ruleset a{rule b{select when a b} rule c{select when a c} rule b{}}',
    'Error: Duplicate rule name: b'
  )

  tstFail(
    'ruleset a{global{b=1;c=3;b=1}}',
    'Error: Duplicate declaration: b'
  )
  tstFail(
    'ruleset a{rule b{select when a b pre{b=1;c=3;b=1}}}',
    'Error: Duplicate declaration: b'
  )
  tstFail(
    'ruleset a{global{act=defaction(){noop()};act=1}}',
    'Error: Duplicate declaration: act'
  )

  tstFail(
    'ruleset a{global{b=function(c,d,c){1}}}',
    'Error: Duplicate parameter: c'
  )
  tstFail(
    'ruleset a{global{b=function(c,d=1,e){1}}}',
    'Error: Cannot have a non-default parameter after a defaulted one'
  )
  tstFail(
    `ruleset a{global{
      add = function(a,b){a+b}
      foo = add(b = 1, 2)
    }}`,
    'Error: Once you used a named arg, all following must be named.'
  )
  tstWarn(
    `ruleset a{global{
      add = {"foo": 1}
      bar = add.foo
    }}`,
    'DEPRECATED use `{}` or `[]` instead of `.`'
  )
  tstFail(
    'event:attrs()',
    'Error: `event:attrs` is a Map, not a Function. Use `event:attrs{key}` instead'
  )

  tstFail(
    'ruleset a{meta{shares hello}global {hello = defaction(){noop()}}}',
    'Error: Actions must not be shared: hello'
  )

  tstWarn(
    `ruleset a{
      global {a=1}
      rule a{select when a a bb re#.# where a > 0 setting(bb)}}
    `,
    'DEPRECATED SYNTAX - Move the `where` clause to be after the `setting`'
  )
  tstWarn(
    'ruleset a{rule a{select when a a setting(bb)}}',
    'DEPRECATED SYNTAX - What are you `setting`? There are no attribute matches'
  )

  tstWarn(
    'ruleset a{rule b{select when a b always{ent:v:=ent:v.put("k",1)}}}',
    'Performance Hint: to leverage indexes use `ent:v{key} := value` instead of .put(key, value)'
  )
  // if different ent vars, don't hint
  t.is(compiler('ruleset a{rule b{select when a b always{ent:hi:=ent:ih.put("k",1)}}}').warnings.length, 0)
  // if already has subpath don't hint
  t.is(compiler('ruleset a{rule b{select when a b always{ent:v{"a"}:=ent:v.put("k",1)}}}').warnings.length, 0)

  tstFail(
    'ruleset a {meta{provides foo}}',
    'Error: Trying to provide: foo but it\'s not defined in global'
  )
})

test('special cases', function (t) {
  // args shouldn't be dependent on each other and cause strange duplication
  var js = compiler('function(foo,bar,baz){foo(1).bar(baz(2))}').code

  t.is(js, `($ctx.krl.Function([
  "foo",
  "bar",
  "baz"
], async function (foo3, bar3, baz3) {
  return await $ctx.krl.assertFunction(bar3)($ctx, [
    await $ctx.krl.assertFunction(foo3)($ctx, [1]),
    await $ctx.krl.assertFunction(baz3)($ctx, [2])
  ]);
}))`)
})

test('rid output', function (t) {
  const out = compiler('ruleset some.rid {global {a=2}}')
  t.is(out.rid, 'some.rid')
})

test('stdlib and missing variables', function (t) {
  t.notThrows(() => compiler(`
  ruleset rs {
    global {
      foo = head
    }
  }
  `))
  t.throws(() => compiler(`
  ruleset rs {
    global {
      foo = bar
    }
  }
  `), { message: 'Undefined id: bar' })
})

test('share somethingNotDefined', function (t) {
  t.throws(() => compiler(`
  ruleset rs {
    meta {
        shares something, somethingNotDefined
    }
    global {
      something = 1
    }
  }
  `), { message: 'Trying to share: somethingNotDefined but it\'s not defined in global' })
})

test('allow function body to use a variable declared later', function (t) {
  let out = compiler(`
  ruleset rs {
    global {
      foo = function(){ bar }
      bar = 1
    }
  }
  `)
  t.is(out.warnings.length, 0)

  out = compiler(`
  ruleset rs {
    global {
      foo = function(){ bar() }
      bar = function(){ 1 }
    }
  }
  `)
  t.is(out.warnings.length, 0)

  t.throws(() => compiler(`
  ruleset rs {
    global {
      foo = bar()
      bar = function(){ 1 }
    }
  }
  `), { message: 'Undefined id: bar' })
})

test('type inference action vs function', function (t) {
  t.throws(() => compiler(`
  ruleset rs {
    global {
      fun = function(){ 1 }
    }
    rule a {
      select when a a
      fun()
    }
  }
  `), { message: 'Not an action: Function' })

  t.throws(() => compiler(`
  ruleset rs {
    global {
      act = defaction(){ noop() }
      bar = act()
    }
  }
  `), { message: 'Not a function: Action' })
})

test('rulesetSchema alsoSelectedBy includes unannotated rules and or alternatives', function (t) {
  var src = [
    'ruleset io.test {',
    '  /** Main. */',
    '  rule main {',
    '    select when app open or app close',
    '    if true then every { noop() }',
    '  }',
    '  rule helperOpen { select when app open if false then every { noop() } }',
    '  rule helperClose { select when app close if false then every { noop() } }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  t.is(op.alsoSelectedBy.length, 2)
  t.true(op.alsoSelectedBy.some(function (p) { return p.rule === 'helperOpen' }))
  t.true(op.alsoSelectedBy.some(function (p) { return p.rule === 'helperClose' }))
})

test('rulesetSchema select attr patterns become constraints', function (t) {
  var src = [
    'ruleset io.test {',
    '  /** Install. @attr url String */',
    '  rule install { select when wrangler install url re#(.+)# if true then every { noop() } }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  t.deepEqual(op.entry[0].constraints, [{ attr: 'url', op: 'pattern', pattern: '(.+)' }])
})

test('rulesetSchema @attr optional wins over select pattern required', function (t) {
  var src = [
    'ruleset io.test {',
    '  /**',
    '   * Child.',
    '   * @attr color String optional',
    '   */',
    '  rule child { select when wrangler child color re#.*# if true then every { noop() } }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  var color = op.attrs.find(function (a) { return a.name === 'color' })
  t.false(color.required)
})

test('rulesetSchema prechecks skip shared calls used as values in condition', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares wellKnown_Rx }',
    '  global { wellKnown_Rx = function() { { "id": "x" } } }',
    '  /** Rx. */',
    '  rule rx {',
    '    select when wrangler subscription',
    '    if event:attr("x") != wellKnown_Rx(){"id"} then every { noop() }',
    '  }',
    '}'
  ].join('\n')
  var op = require('./src/schemaFromSource')(src).rulesetSchema.operations[0]
  t.deepEqual(op.prechecks, [])
})

test('krl check accepts event:attrs{key} and event:attrs forward as attr reads', function (t) {
  var src = [
    'ruleset io.test {',
    '  /**',
    '   * Channel.',
    '   * @attr name String',
    '   */',
    '  rule ch {',
    '    select when wrangler channel',
    '    if event:attrs{"name"} then every { noop() }',
    '    fired { raise wrangler event "done" attributes event:attrs }',
    '  }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.false(out.warnings.some(function (w) {
    return w.message.indexOf('@attr name') !== -1
  }))
})

test('krl check @attr read only in alsoSelectedBy sibling is not unused', function (t) {
  var src = [
    'ruleset io.test {',
    '  /**',
    '   * Main.',
    '   * @attr target_did String optional',
    '   */',
    '  rule main {',
    '    select when app open or app close',
    '    if true then every { noop() }',
    '  }',
    '  rule layer2 {',
    '    select when app open or app close',
    '    pre { target_did = event:attr("target_did") }',
    '    if target_did then every { noop() }',
    '  }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.false(out.warnings.some(function (w) {
    return w.message.indexOf('target_did') !== -1 && w.message.indexOf('not read') !== -1
  }))
})

test('__testing compat alias uses rulesetSchema when annotated', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares ping }',
    '  global { /** q @returns Any */ ping = function() { 1 } }',
    '  /** Send ping. @attr msg String */',
    '  rule send { select when test ping if event:attr("msg") then every { noop() } }',
    '}'
  ].join('\n')
  var schema = require('./src/schemaFromSource')(src).rulesetSchema
  var testing = require('./src/rulesetSchemaToTesting')(schema)
  t.is(testing.events.length, 1)
  t.is(testing.events[0].domain, 'test')
  t.is(testing.queries[0].name, 'ping')
  t.deepEqual(testing.events[0].attrs, ['msg'])
  var out = compiler(src)
  t.true(out.code.indexOf('"domain": "test"') !== -1)
  t.true(out.code.indexOf('"attrs": ["msg"]') !== -1)
})

test('rulesetSchema includes @example on operations and queries', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares lookup }',
    '  global {',
    '    /**',
    '     * Lookup.',
    '     * @param key String',
    '     * @returns Any',
    '     * @example "by role" { "key": "Tx_role", "value": "manifold_thing" }',
    '     */',
    '    lookup = function(key, value) { null }',
    '  }',
    '  /**',
    '   * Open.',
    '   * @attr name String',
    '   * @example "minimal" { "name": "test" }',
    '   */',
    '  rule open {',
    '    select when app open',
    '    if event:attr("name") then every { noop() }',
    '  }',
    '}'
  ].join('\n')
  var schema = require('./src/schemaFromSource')(src).rulesetSchema
  t.deepEqual(schema.operations[0].examples, [{ name: 'minimal', attrs: { name: 'test' } }])
  t.deepEqual(schema.queries[0].examples, [{
    name: 'by role',
    args: { key: 'Tx_role', value: 'manifold_thing' }
  }])
})

test('krl check warns on unknown doc tag', function (t) {
  var src = [
    'ruleset io.test {',
    '  /**',
    '   * Open.',
    '   * @deprecated use other',
    '   */',
    '  rule open { select when app open if true then every { noop() } }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.true(out.warnings.some(function (w) {
    return w.message.indexOf('@deprecated') !== -1 && w.message.indexOf('ignored') !== -1
  }))
})

test('krl check warns on @example key not in attrs', function (t) {
  var src = [
    'ruleset io.test {',
    '  /**',
    '   * Open.',
    '   * @attr name String',
    '   * @example "bad" { "nope": "x" }',
    '   */',
    '  rule open { select when app open if true then every { noop() } }',
    '}'
  ].join('\n')
  var out = require('./src/check')(src)
  t.true(out.ok)
  t.true(out.warnings.some(function (w) {
    return w.message.indexOf('nope') !== -1 && w.message.indexOf('@example') !== -1
  }))
})

test('rulesetSchema shared alias query uses target params', function (t) {
  var src = [
    'ruleset io.test {',
    '  meta { shares establishRelationship }',
    '  global {',
    '    establishSubscription = function(key, value) { null }',
    '    /** Alias API. @param key String @param value String @returns Any */',
    '    establishRelationship = establishSubscription',
    '  }',
    '}'
  ].join('\n')
  var q = require('./src/schemaFromSource')(src).rulesetSchema.queries[0]
  t.is(q.name, 'establishRelationship')
  t.is(q.args.length, 2)
  t.is(q.args[0].name, 'key')
})
