var _ = require('lodash')
var λ = require('contra')
var fs = require('fs')
var diff = require('diff-lines')
var path = require('path')
var test = require('ava')
var compiler = require('./')

var filesDir = path.resolve(__dirname, '../../test-rulesets')

test.cb('compiler', function (t) {
  fs.readdir(filesDir, function (err, files) {
    if (err) return t.end(err)

    var basenames = _.uniq(_.map(files, function (file) {
      return path.basename(path.basename(file, '.krl'), '.js')
    }))

    λ.each(basenames, function (basename, next) {
      var jsFile = path.join(filesDir, basename) + '.js'
      var krlFile = path.join(filesDir, basename) + '.krl'
      λ.concurrent({
        js: λ.curry(fs.readFile, jsFile, 'utf8'),
        krl: λ.curry(fs.readFile, krlFile, 'utf8')
      }, function (err, srcs) {
        if (err) return t.end(err)

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
    }, t.end)
  })
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

  tstWarn(
    'ruleset a{global{b=1;c=3;b=1}}',
    'Duplicate declaration: b'
  )
  tstWarn(
    'ruleset a{rule b{select when a b pre{b=1;c=3;b=1}}}',
    'Duplicate declaration: b'
  )
  tstWarn(
    'ruleset a{global{act=defaction(){noop()};act=1}}',
    'Duplicate declaration: act'
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
    'Error: Actions cannot be used queries: hello'
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

test('rid+version output', function (t) {
  const out = compiler('ruleset some.rid {version "some-version" global {a=2}}')

  t.is(out.rid, 'some.rid')
  t.is(out.version, 'some-version')
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
