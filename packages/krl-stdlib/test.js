var _ = require('lodash')
var stdlib = require('./')
var test = require('ava')
var types = require('./types')

var defaultCTX = {
  emit: _.noop
}

var action = function () {}
action.is_an_action = true

var lib = _.mapValues(stdlib, function (fn) {
  return function () {
    var args = _.toArray(arguments)
    args.unshift(defaultCTX)
    return fn.apply(null, args)
  }
})

var testFn = function (t, fn, args, expected, message) {
  if (!message) {
    message = 'testing stdlib["' + fn + '"]'
  }
  t.deepEqual(lib[fn].apply(null, args), expected, message)
}

var testFnErr = function (t, fn, args, type, message) {
  try {
    lib[fn].apply(null, args)
    t.fail('Failed to throw an error')
  } catch (err) {
    t.is(err.name, type, message)
  }
}

var wrapFunctions = function (args) {
  return _.map(args, function (arg) {
    if (types.isFunction(arg)) {
      return function (ctx, args) {
        return new Promise(function (resolve) {
          process.nextTick(function () {
            var p = arg.apply(void 0, args)
            resolve(p)
          })
        })
      }
    }
    return arg
  })
}

var ytfMatrix = async function (ytf, obj, args, exp) {
  var i
  for (i = 0; i < exp.length; i++) {
    var j
    for (j = 0; j < args.length; j++) {
      await ytf(exp[i][0], [obj, args[j]], exp[i][j + 1])
    }
  }
}

var mkTf = function (t) {
  return async function (fn, args, expected, message) {
    args = wrapFunctions(args)
    var p = lib[fn].apply(null, args)
    p = Promise.resolve(p)
    var r = await p
    t.deepEqual(r, expected, message)
  }
}

var mkTfe = function (t) {
  return async function (fn, args, type, message) {
    args = wrapFunctions(args)
    try {
      var p = lib[fn].apply(null, args)
      p = Promise.resolve(p)
      await p
      t.fail('Failed to throw an error')
    } catch (err) {
      t.is(err.name, type, message)
    }
  }
}

test('infix operators', function (t) {
  var tf = _.partial(testFn, t)
  var tfe = _.partial(testFnErr, t)

  tf('+', [1], 1)
  tf('+', [-1], -1)
  tf('+', [1, 2], 3)
  tf('+', [2.3, 0.1], 2.4)

  // concat +
  tf('+', [1, null], '1null')
  tf('+', [null, 1], 'null1')
  tf('+', [1, false], '1false')
  tf('+', [false, 1], 'false1')
  tf('+', [_.noop, 'foo'], '[Function]foo')
  tf('+', [1, true], '1true')
  tf('+', ['wat', 100], 'wat100')
  tf('+', [{}, []], '[Map][Array]')

  tf('-', [2], -2)
  tf('-', ['-2'], 2)
  tfe('-', ['zero'], 'TypeError')
  tf('-', [[0]], -1)
  tf('-', [{}], -0)

  tf('-', [1, 3], -2)
  tf('-', ['1', 3], -2)
  tf('-', [4, '1'], 3)
  tf('-', ['4', '1'], 3)
  tfe('-', ['two', 1], 'TypeError')
  tf('-', [[], '-1'], 1)
  tf('-', [{ a: 1, b: 1, c: 1 }, [1]], 2, 'map.length() - array.length()')

  tf('==', [null, NaN], true)
  tf('==', [NaN, void 0], true)
  tf('==', [null, void 0], true)
  tf('==', [NaN, NaN], true)
  tf('==', [null, 0], false)
  tf('==', [0, null], false)
  tf('==', [0, void 0], false)
  tf('==', [0, NaN], false)
  tf('==', [false, null], false)
  tf('==', [true, 1], false)
  tf('==', [{ a: ['b'] }, { a: ['b'] }], true)
  tf('==', [{ a: ['b'] }, { a: ['c'] }], false)

  tf('*', [5, 2], 10)
  tfe('*', ['two', 1], 'TypeError')
  tfe('*', [1, _.noop], 'TypeError')

  tf('/', [4, 2], 2)
  tfe('/', ['two', 1], 'TypeError')
  tf('/', ['2', 1], 2)
  tfe('/', [1, _.noop], 'TypeError')
  t.is(stdlib['/']({
    emit: function (kind, err) {
      t.is(kind + err, 'debug[DIVISION BY ZERO] 9 / 0')
    }
  }, 9, 0), 0)

  tf('%', [4, 2], 0)
  tf('%', ['1', '0'], 0)
  tfe('%', [1, 'two'], 'TypeError')
  tf('%', [[1, 2, 3, 4], [1, 2]], 0, '.length() % .length()')
  tfe('%', [_.noop, 1], 'TypeError')

  tf('like', ['wat', /a/], true)
  tf('like', ['wat', /b/], false)
  tf('like', ['wat', 'da'], false)
  tf('like', ['wat', 'a.*?(a|t)'], true)

  tf('<=>', ['5', '10'], -1)
  tf('<=>', [5, '5'], 0)
  tf('<=>', ['10', 5], 1)
  tf('<=>', [NaN, void 0], 0)
  tf('<=>', [null, 0], 0)
  tf('<=>', [null, false], 0)
  tf('<=>', [true, 1], 0)
  tf('<=>', [true, false], 1)
  tf('<=>', [[0, 1], [1, 1]], 0)
  tf('<=>', [20, 3], 1)
  tf('<=>', ['20', 3], 1)
  tf('<=>', [20, '3'], 1)
  tf('<=>', ['20', '3'], 1, 'parse numbers then compare')
  tf('<=>', ['.2', 0.02], 1, 'parse numbers then compare')
  tf('<=>', [['a', 'b'], 2], 0, '.length() of arrays')
  tf('<=>', [{ ' ': -0.5 }, 1], 0, '.length() of maps')
  tf('<=>', [[1, 2, 3], { a: 'b', z: 'y', c: 'd' }], 0, 'compare the .length() of each')

  tf('<=>', [_.noop, '[Function]'], 0, 'Functions drop down to string compare')
  tf('<=>', [action, '[Action]'], 0, 'Actions drop down to string compare')
  tf('<=>', [/good/, 're#good#'], 0, 'RegExp drop down to string compare')

  tf('<=>', [1, 'a'], -1, "if both can't be numbers, then string compare")
  tf('<=>', ['to', true], -1, "if both can't be numbers, then string compare")

  // <, >, <=, >= all use <=> under the hood
  tf('<', ['3', '20'], true)
  tf('>', ['a', 'b'], false)
  tf('>', ['2018-03-07', '2018-03-05'], true)
  tf('>', ['02', '1'], true)
  tf('<=', ['a', 'a'], true)
  tf('<=', ['a', 'b'], true)
  tf('<=', ['b', 'a'], false)
  tf('>=', ['a', 'a'], true)
  tf('>=', ['a', 'b'], false)
  tf('>=', ['b', 'a'], true)

  tf('cmp', ['aab', 'abb'], -1)
  tf('cmp', ['aab', 'aab'], 0)
  tf('cmp', ['abb', 'aab'], 1)
  tf('cmp', [void 0, NaN], 0, '"null" === "null"')
  tf('cmp', ['5', '10'], 1)
  tf('cmp', [5, '5'], 0)
  tf('cmp', ['10', 5], -1)
  tf('cmp', [{ '': -0.5 }, { ' ': 0.5 }], 0)
  tf('cmp', [[], [['']]], 0)
  tf('cmp', [null, 0], 1)
  tf('cmp', [20, 3], -1, 'cmp always converts to string then compares')
})

test('type operators', function (t) {
  var tf = _.partial(testFn, t)
  var tfe = _.partial(testFnErr, t)

  tf('as', [1, 'String'], '1')
  tf('as', [0.32, 'String'], '0.32')
  tf('as', [0, 'String'], '0')
  tf('as', [null, 'String'], 'null')
  tf('as', [void 0, 'String'], 'null')
  tf('as', [NaN, 'String'], 'null')
  tf('as', [true, 'String'], 'true')
  tf('as', [false, 'String'], 'false')
  tf('as', ['str', 'String'], 'str')
  tf('as', [/^a.*b/, 'String'], 're#^a.*b#')
  tf('as', [/^a.*b/gi, 'String'], 're#^a.*b#gi')
  tf('as', [_.noop, 'String'], '[Function]')
  tf('as', [[1, 2], 'String'], '[Array]')
  tf('as', [{}, 'String'], '[Map]')
  tf('as', [arguments, 'String'], '[Map]')

  tf('as', ['-1.23', 'Number'], -1.23)
  tf('as', [42, 'Number'], 42)
  tf('as', [true, 'Number'], 1)
  tf('as', [false, 'Number'], 0)
  tf('as', [null, 'Number'], 0)
  tf('as', [NaN, 'Number'], 0)
  tf('as', [void 0, 'Number'], 0)
  tf('as', ['foo', 'Number'], null)
  tf('as', [{}, 'Number'], 0)
  tf('as', [[1, 2], 'Number'], 2)
  tf('as', [{ a: 'b', z: 'y', c: 'd' }, 'Number'], 3)
  tf('as', ['', 'Number'], 0)
  tf('as', ['2018-03-07', 'Number'], null)
  tf('as', ['2018-03-07', 'Number'], null)
  tf('as', ['1,000', 'Number'], null)
  tf('as', ['1,000.25', 'Number'], null)
  tf('as', ['1000.25', 'Number'], 1000.25)
  tf('as', [' 123 ', 'Number'], 123)
  tf('as', [' 1 2 ', 'Number'], null)
  tf('as', [' +5  ', 'Number'], 5)
  tf('as', [' + 5  ', 'Number'], null)
  tf('as', ['0xAF', 'Number'], 175)
  tf('as', ['0o72', 'Number'], 58)
  tf('as', ['0b01101', 'Number'], 13)
  tf('as', ['0b02101', 'Number'], null)

  t.is(stdlib.as(defaultCTX, '^a.*z$', 'RegExp').source, /^a.*z$/.source)
  t.is(stdlib.as(defaultCTX, null, 'RegExp').source, 'null')
  t.is(stdlib.as(defaultCTX, 123, 'RegExp').source, '123')
  t.is(stdlib.as(defaultCTX, _.noop, 'RegExp').source, '\\[Function\\]')
  t.is(stdlib.as(defaultCTX, '[Function]', 'RegExp').source, '[Function]')

  var testRegex = /^a.*z$/
  tf('as', [testRegex, 'RegExp'], testRegex)
  tf('as', ['true', 'Boolean'], true)
  tf('as', ['false', 'Boolean'], false)
  tf('as', [0, 'Boolean'], false)
  tfe('as', ['0', 'num'], 'TypeError')
  tfe('as', [{}, /boolean/], 'TypeError')

  tf('isnull', [], true)
  tf('isnull', [void 0], true)
  tf('isnull', [null], true)
  tf('isnull', [NaN], true)
  tf('isnull', [false], false)
  tf('isnull', [0], false)
  tf('isnull', [''], false)
  tf('isnull', [{}], false)

  tf('typeof', [''], 'String')
  tf('typeof', ['1'], 'String')
  tf('typeof', [0], 'Number')
  tf('typeof', [-0.01], 'Number')
  tf('typeof', [10e10], 'Number')
  tf('typeof', [true], 'Boolean')
  tf('typeof', [false], 'Boolean')
  tf('typeof', [void 0], 'Null')
  tf('typeof', [null], 'Null')
  tf('typeof', [NaN], 'Null')
  tf('typeof', [/a/], 'RegExp')
  tf('typeof', [[]], 'Array')
  tf('typeof', [{}], 'Map')
  tf('typeof', [_.noop], 'Function')
  tf('typeof', [arguments], 'Map')

  // special tests for Map detection
  t.is(types.isMap(null), false)
  t.is(types.isMap(void 0), false)
  t.is(types.isMap(NaN), false)
  t.is(types.isMap(_.noop), false)
  t.is(types.isMap(/a/i), false)
  t.is(types.isMap([1, 2]), false)
  t.is(types.isMap(new Array(2)), false)
  t.is(types.isMap('foo'), false)
  t.is(types.isMap(new String('bar')), false)// eslint-disable-line
  t.is(types.isMap(10), false)
  t.is(types.isMap(new Number(10)), false)// eslint-disable-line

  t.is(types.isMap({}), true)
  t.is(types.isMap({ a: 1, b: 2 }), true)
  t.is(types.isMap(arguments), true)

  t.is(stdlib['typeof'](defaultCTX, action), 'Action')
})

test('number operators', function (t) {
  var tf = _.partial(testFn, t)

  tf('chr', [74], 'J')
  tf('chr', ['no'], null)

  tf('range', [0, 0], [0])
  tf('range', ['0', 10], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  tf('range', [1, '-6'], [1, 0, -1, -2, -3, -4, -5, -6])
  tf('range', ['-1.5', '-3.5'], [-1.5, -2.5, -3.5])
  tf('range', [-4], [])
  tf('range', [-4, _.noop], [])
  tf('range', [null, 0], [0], 'range auto convert null -> 0')
  tf('range', [0, [1, 2, 3]], [0, 1, 2, 3], '0.range(.length())')

  tf('sprintf', [0.25], '')
  tf('sprintf', [0.25, 'That is %s'], 'That is %s')
  tf('sprintf', [0.25, '%d = %d'], '0.25 = 0.25')
  tf('sprintf', [0.25, '\\%s%d\\\\n = .25%s'], '\\%s0.25\\n = .25%s')
  tf('sprintf', [0.25, '%\\d%d\\\\\\%dd\\n'], '%\\d0.25\\%dd\\n')
  tf('sprintf', [_.noop, void 0], 'null')
})

test('string operators', async function (t) {
  var tf = _.partial(testFn, t)
  var ytf = mkTf(t)

  tf('sprintf', ['Bob'], '')
  tf('sprintf', ['Bob', 'Yo'], 'Yo')
  tf('sprintf', ['Bob', '%s is %s'], 'Bob is Bob')
  tf('sprintf', ['Bob', '\\%d%s\\\\n is Bob%d'], '\\%dBob\\n is Bob%d')
  tf('sprintf', ['Bob', '%\\s%s\\\\\\%ss\\n'], '%\\sBob\\%ss\\n')
  tf('sprintf', [_.noop, 'Hi %s!'], 'Hi %s!')
  tf('sprintf', [{}, 'Hey.'], 'Hey.')

  tf('capitalize', ['lower'], 'Lower')
  tf('capitalize', [''], '')
  tf('capitalize', [' l'], ' l')

  tf('decode', ['[1,2,3]'], [1, 2, 3])
  tf('decode', [[1, 2, null]], [1, 2, null], 'if not a string, return it')
  tf('decode', [void 0], void 0, 'if not a string, just return it')
  tf('decode', ['[1,2'], '[1,2', 'if parse fails, just return it')
  tf('decode', ['[1 2]'], '[1 2]', 'if parse fails, just return it')

  tf('extract', ['3 + 2 - 1'], [])
  tf('extract', ['3 + 2 - 1', /([0-9])/g], ['3', '2', '1'])
  tf('extract', ['no-match', /([0-9])/g], [])
  tf('extract', ['This is a string', /(is)/], ['is'])
  tf('extract', ['This is a string', /(s.+).*(.ing)/], ['s is a st', 'ring'])
  tf('extract', ['This is a string', /(boot)/], [])
  tf('extract', ['I like cheese', /like (\w+)/], ['cheese'])
  tf('extract', ['I like cheese', /(e)/g], ['e', 'e', 'e', 'e'])
  tf('extract', ['I like cheese', '(ch.*)'], ['cheese'], 'convert strings to RegExp')
  tf('extract', ['what the null?', /null/], [])
  tf('extract', ['what the null?', void 0], [])

  tf('lc', ['UppER'], 'upper')

  tf('match', ['3 + 2 - 1', '([0-9])'], true)
  tf('match', ['no-match', /([0-9])/g], false)
  tf('match', ['1', 1], false)
  tf('match', [0, /0/], true)
  tf('match', ['$', new RegExp('$$$', '')], true)

  tf('ord', [''], null)
  tf('ord', ['a'], 97)
  tf('ord', ['bill'], 98)
  tf('ord', ['0'], 48)

  await ytf('replace', ['william W.', /W/i], 'illiam W.')
  await ytf('replace', ['William W.', /W/g, 'B'], 'Billiam B.')
  await ytf('replace', ['Sa5m', 5, true], 'Satruem')
  await ytf('replace', [[false, void 0], /(?:)/ig], '[Array]')
  await ytf('replace', [[false, void 0]], [false, void 0])

  await ytf('replace', ['start 1 then 2? 3-42 end', /(\d+)/g, function (match) {
    return (parseInt(match, 10) * 2) + ''
  }], 'start 2 then 4? 6-84 end')

  await ytf('replace', ['1 2 3', /(\d)/g, function (match, p1, offset, string) {
    t.is(arguments.length, 4)
    t.is(match, p1)
    t.is(string.substring(offset, offset + p1.length), p1)
    t.is(string, '1 2 3')
    return (parseInt(match, 10) * 2) + ''
  }], '2 4 6')

  await ytf('replace', ['000abc333???wat', /([a-z]+)(\d*)([^\w]*)/, function (match, p1, p2, p3, offset, string) {
    t.is(arguments.length, 6)
    t.is(match, 'abc333???')
    t.is(p1, 'abc')
    t.is(p2, '333')
    t.is(p3, '???')
    t.is(offset, 3)
    t.is(string, '000abc333???wat')
    return '[' + p1 + ' - ' + p2 + ' : ' + p3 + ']'
  }], '000[abc - 333 : ???]wat')

  tf('split', ['a;b;3;4;', /;/], ['a', 'b', '3', '4', ''])
  tf('split', ['a;b;3;4;', ''], ['a', ';', 'b', ';', '3', ';', '4', ';'])
  tf('split', ['33a;b;3;4;', 3], ['', '', 'a;b;', ';4;'])

  tf('substr', ['This is a string', 5], 'is a string')
  tf('substr', ['This is a string', 5, null], 'is a string')
  tf('substr', ['This is a string', 5, '4'], 'is a')
  tf('substr', ['This is a string', '5', -5], 'is a s')
  tf('substr', ['This is a string', '5', '-15'], 'his ')
  tf('substr', ['This is a string', 5, -18], 'This ')
  tf('substr', ['This is a string', 0, 25], 'This is a string')
  tf('substr', ['This is a string', 1, 25], 'his is a string')
  tf('substr', ['This is a string', 16, 0], '')
  tf('substr', ['This is a string', 16, -1], 'g')
  tf('substr', ['This is a string', 25], '')
  tf('substr', [['Not a string', void 0]], '[Array]')
  tf('substr', [void 0, 'Not an index', 2], 'null')

  tf('uc', ['loWer'], 'LOWER')

  tf('trimLeading', [' \n\t hi \n\t '], 'hi \n\t ')
  tf('trimTrailing', [' \n\t hi \n\t '], ' \n\t hi')
  tf('trim', [' \n\t hi \n\t '], 'hi')
  tf('trimLeading', [_.noop], '[Function]')
  tf('trimTrailing', [_.noop], '[Function]')
  tf('trim', [_.noop], '[Function]')

  tf('startsWith', ['abcd', 'ab'], true)
  tf('startsWith', ['abcd', 'b'], false)
  tf('startsWith', ['ab', 'ab'], true)
  tf('endsWith', ['abcd', 'cd'], true)
  tf('endsWith', ['abcd', 'c'], false)
  tf('endsWith', ['c', 'c'], true)
  tf('contains', ['abcd', 'c'], true)
  tf('contains', ['abcd', 'dc'], false)
})

test('collection operators', async function (t) {
  var tf = _.partial(testFn, t)
  var tfe = _.partial(testFnErr, t)
  var ytf = mkTf(t)
  var ytfe = mkTfe(t)
  var ytfm = _.partial(ytfMatrix, ytf)

  var a = [3, 4, 5]
  var b = null
  var c = []

  var obj = {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': { 'bar': { '10': 'I like cheese' } }
  }
  var obj2 = { 'a': 1, 'b': 2, 'c': 3 }
  var assertObjNotMutated = function () {
    t.deepEqual(obj, {
      'colors': 'many',
      'pi': [3, 1, 4, 1, 5, 9, 3],
      'foo': { 'bar': { '10': 'I like cheese' } }
    }, 'should not be mutated')
    t.deepEqual(obj2, { 'a': 1, 'b': 2, 'c': 3 }, 'should not be mutated')
  }

  var fnDontCall = function () {
    throw new Error()
  }

  tf('><', [obj, 'many'], false)
  tf('><', [obj, 'pi'], true)
  tf('><', [obj, 'bar'], false)
  assertObjNotMutated()
  tf('><', [[5, 6, 7], 6], true)
  tf('><', [[5, 6, 7], 2], false)
  tf('><', [[], null], false)
  tf('><', [{}, void 0], false)
  tf('><', [void 0, NaN], true)

  await ytfm(a, [
    function (x) { return x < 10 }, // 1
    function (x) { return x > 3 }, // 2
    function (x) { return x > 10 }, // 3
    action // 4
  ], [ // 1      2      3      4
    ['all', true, false, false, false],
    ['notall', false, true, true, true],
    ['any', true, true, false, false],
    ['none', false, false, true, true]
  ])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')

  await ytfm(b, [
    function (x) { return stdlib.isnull({}, x) }, // 1
    action // 2
  ], [ // 1      2
    ['all', true, false],
    ['notall', false, true],
    ['any', true, false],
    ['none', false, true]
  ])

  await ytfm(c, [
    fnDontCall, // 1
    action // 2
  ], [ // 1      2
    ['all', true, true],
    ['notall', false, false],
    ['any', false, false],
    ['none', true, true]
  ])
  t.deepEqual(c, [], 'should not be mutated')

  tf('append', [['a', 'b'], ['c', 'a']], ['a', 'b', 'c', 'a'])
  tf('append', [['a', 'b'], 10, 11], ['a', 'b', 10, 11])
  tf('append', [10, 11], [10, 11])
  tf('append', [a, [6]], [3, 4, 5, 6])
  tf('append', [a, [[]]], [3, 4, 5, []])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  tf('append', [b, []], [null])
  tf('append', [b], [null])
  tf('append', [c, []], [])
  tf('append', [c], [])
  tf('append', [c, [[]]], [[]])
  t.deepEqual(c, [], 'should not be mutated')

  tf('append', [['a'], 'b'], ['a', 'b'])
  tf('append', [{ 0: 'a' }, 'b'], [{ 0: 'a' }, 'b'], 'object that looks like an array, is not auto-magically converted to an array')
  tf('append', [[['a']], 'b'], [['a'], 'b'])
  tf('append', [null, 'b'], [null, 'b'])
  tf('append', [[null], 'b'], [null, 'b'])
  tf('append', [void 0, 'b'], [void 0, 'b'])
  tf('append', [[void 0], 'b'], [void 0, 'b'])
  tf('append', [[], 'b'], ['b'])

  var collectFn = function (a) {
    return stdlib['<']({}, a, 5) ? 'x' : 'y'
  }

  await ytf('collect', [[7, 4, 3, 5, 2, 1, 6], collectFn], {
    'x': [4, 3, 2, 1],
    'y': [7, 5, 6]
  })
  await ytf('collect', [null, collectFn], { 'x': [null] })
  await ytf('collect', [[], fnDontCall], {})
  await ytf('collect', [[7]], {})
  await ytf('collect', [[7], action], {})
  // map tests

  await ytf('filter', [a, function (x) { return x < 5 }], [3, 4])
  await ytf('filter', [a, function (x) { return x > 5 }], [])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  await ytf('filter', [b, function (x) { return stdlib.isnull({}, x) }], [null])
  await ytf('filter', [c, fnDontCall], [])
  t.deepEqual(c, [], 'should not be mutated')
  await ytf('filter', [obj2, function (v, k) { return v < 3 }], { 'a': 1, 'b': 2 })
  await ytf('filter', [obj2, function (v, k) { return k === 'b' }], { 'b': 2 })
  assertObjNotMutated()
  await ytf('filter', [b, action], null)

  tf('head', [a], 3)
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  tf('head', [[null, {}]], null)
  tf('head', ['string'], 'string')
  tf('head', [{ '0': null }], { '0': null })
  tf('head', [[]], void 0)

  tf('tail', [a], [4, 5])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  tf('tail', [obj], [])
  assertObjNotMutated()
  tf('tail', ['string'], [])

  tf('index', [a, 5], 2)
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  tf('index', [b, NaN], 0)
  tf('index', [obj, 'colors'], -1)
  tf('index', [obj2, 2], -1)
  assertObjNotMutated()
  tf('index', [c], -1)
  t.deepEqual(c, [], 'should not be mutated')
  tf('index', [[[[0], 0], [0, [0]], [[0], 0], [0, [0]]], [0, [0]]], 1)

  tf('join', [a, ';'], '3;4;5')
  tf('join', [a], '3,4,5', 'default to ,')
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  tf('join', [b], 'null')
  tf('join', [NaN], 'null')
  tf('join', [c, action], '')
  t.deepEqual(c, [], 'should not be mutated')
  tf('join', [['<', '>'], /|/], '<re#|#>')

  tf('length', [a], 3)
  tf('length', [[void 0, 7]], 2)
  tf('length', ['"'], 1)
  tf('length', [/'/], 0)
  tf('length', [function (a, b) {}], 0)

  tf('isEmpty', [null], true)
  tf('isEmpty', [void 0], true)
  tf('isEmpty', [NaN], true)
  tf('isEmpty', [0], true)
  tf('isEmpty', [1], true)
  tf('isEmpty', [true], true)
  tf('isEmpty', [[]], true)
  tf('isEmpty', [[1, 2]], false)
  tf('isEmpty', [{}], true)
  tf('isEmpty', [{ a: 1 }], false)
  tf('isEmpty', [''], true)
  tf('isEmpty', [' '], false)
  tf('isEmpty', [function (a, b) {}], true)

  await ytf('map', [a, function (x) { return x + 2 }], [5, 6, 7])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  await ytf('map', [[3, 4, void 0]], [3, 4, void 0])
  await ytf('map', [b, function (x) { return x + '2' }], ['null2'])
  await ytf('map', [action, action], action)
  t.true(types.isAction(action), 'should not be mutated')
  await ytf('map', [c, fnDontCall], [])
  t.deepEqual(c, [], 'should not be mutated')
  await ytf('map', ['012', function (x) { return x + '1' }], ['0121'], 'KRL strings are not arrays')

  await ytf('map', [{}, fnDontCall], {})
  await ytf('map', [obj2, function (v, k) { return v + k }], { 'a': '1a', 'b': '2b', 'c': '3c' })
  assertObjNotMutated()

  await ytf('pairwise', [[a, [6, 7, 8]], function (x, y) { return x + y }], [9, 11, 13])
  await ytf('pairwise', [[a, 'abcdef'.split('')], function (x, y) {
    return stdlib['+']({}, x, y)
  }], [
    '3a',
    '4b',
    '5c',
    'nulld',
    'nulle',
    'nullf'
  ])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  await ytf('pairwise', [[[], []], fnDontCall], [])
  await ytf('pairwise', [[[], 1], function (l, r) { return [l, r] }], [[void 0, 1]])

  await ytfe('pairwise', [{}, fnDontCall], 'TypeError')
  await ytfe('pairwise', [[[]], fnDontCall], 'TypeError')
  await ytfe('pairwise', [[[], []]], 'Error')
  await ytfe('pairwise', [[[], []], action], 'TypeError')

  await ytf('reduce', [a, function (a, b) { return a + b }], 12)
  await ytf('reduce', [a, function (a, b) { return a + b }, 10], 22)
  await ytf('reduce', [a, function (a, b) { return a - b }], -6)
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  await ytf('reduce', [[], fnDontCall], 0)
  await ytf('reduce', [[], fnDontCall, void 0], void 0)
  await ytf('reduce', [76, fnDontCall], 76)
  await ytf('reduce', [null, function (a, b) { return a + b }, '76'], '76null')

  tf('reverse', [a], [5, 4, 3])
  t.deepEqual(a, [3, 4, 5], 'should not be mutated')
  tf('reverse', ['not an array'], 'not an array')

  var veggies = ['corn', 'tomato', 'tomato', 'tomato', 'sprouts', 'lettuce', 'sprouts']
  tf('slice', [veggies, 1, 4], ['tomato', 'tomato', 'tomato', 'sprouts'])
  tf('slice', [veggies, 2, 0], ['corn', 'tomato', 'tomato'])
  tf('slice', [veggies, 2], ['corn', 'tomato', 'tomato'])
  tf('slice', [veggies, 0, 0], ['corn'])
  tf('slice', [veggies, null, NaN], ['corn'])
  tf('slice', [[], 0, 0], [])
  tf('slice', [{ '0': '0' }, 0, 0], [{ '0': '0' }])
  tfe('slice', [veggies, _.noop], 'TypeError')
  tfe('slice', [veggies, 1, _.noop], 'TypeError')
  tfe('slice', [veggies, -1, _.noop], 'TypeError')
  tf('slice', [veggies, 14], [])
  tf('slice', [veggies, 2, -1], [])
  t.deepEqual(veggies, ['corn', 'tomato', 'tomato', 'tomato', 'sprouts', 'lettuce', 'sprouts'], 'should not be mutated')

  tf('splice', [veggies, 1, 4], ['corn', 'lettuce', 'sprouts'])
  tf('splice', [veggies, 2, 0, ['corn', 'tomato']], ['corn', 'tomato', 'corn', 'tomato', 'tomato', 'tomato', 'sprouts', 'lettuce', 'sprouts'])
  tf('splice', [veggies, 2, 0, 'liver'], ['corn', 'tomato', 'liver', 'tomato', 'tomato', 'sprouts', 'lettuce', 'sprouts'])
  tf('splice', [veggies, 2, 2, 'liver'], ['corn', 'tomato', 'liver', 'sprouts', 'lettuce', 'sprouts'])
  tf('splice', [veggies, 1, 10], ['corn'])
  tf('splice', [veggies, 1, 10, 'liver'], ['corn', 'liver'])
  tf('splice', [veggies, 1, 10, []], ['corn'])
  tf('splice', [[], 0, 1], [])
  tf('splice', [[], NaN], [])
  tfe('splice', [veggies, _.noop, 1], 'TypeError')
  tfe('splice', [veggies, 0, _.noop], 'TypeError')
  tf('splice', [veggies, 0, 0], veggies)
  tf('splice', [veggies, 0, veggies.length], [])
  tf('splice', [veggies, 0, 999], [])
  tf('splice', [veggies, 0, -1], [])
  tf('splice', [veggies, 0, -999], [])
  tf('splice', [veggies, -1, 0], veggies)
  tf('splice', [veggies, -999, 0], veggies)
  tf('splice', [void 0, 0, 0], [void 0])
  t.deepEqual(veggies, ['corn', 'tomato', 'tomato', 'tomato', 'sprouts', 'lettuce', 'sprouts'], 'should not be mutated')

  var toSort = [5, 3, 4, 1, 12]
  await ytf('sort', [null, 'numeric'], null)
  await ytf('sort', [toSort], [1, 12, 3, 4, 5])
  await ytf('sort', [toSort, action], [1, 12, 3, 4, 5])
  await ytf('sort', [toSort, 'default'], [1, 12, 3, 4, 5])
  await ytf('sort', [toSort, 'reverse'], [5, 4, 3, 12, 1])
  await ytf('sort', [toSort, 'numeric'], [1, 3, 4, 5, 12])
  await ytf('sort', [toSort, 'ciremun'], [12, 5, 4, 3, 1])

  await ytf('sort', [toSort, function (a, b) {
    return a < b ? -1 : (a === b ? 0 : 1)
  }], [1, 3, 4, 5, 12])
  await ytf('sort', [toSort, function (a, b) {
    return a > b ? -1 : (a === b ? 0 : 1)
  }], [12, 5, 4, 3, 1])
  t.deepEqual(toSort, [5, 3, 4, 1, 12], 'should not be mutated')

  await ytf('sort', [[], function (a, b) {
    return a < b ? -1 : (a === b ? 0 : 1)
  }], [])
  await ytf('sort', [[1], function (a, b) {
    return a < b ? -1 : (a === b ? 0 : 1)
  }], [1])
  await ytf('sort', [[2, 1], function (a, b) {
    return a < b ? -1 : (a === b ? 0 : 1)
  }], [1, 2])
  await ytf('sort', [[2, 3, 1], function (a, b) {
    return a < b ? -1 : (a === b ? 0 : 1)
  }], [1, 2, 3])

  tf('delete', [obj, ['foo', 'bar', 10]], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': { 'bar': {} }
  })
  assertObjNotMutated()
  tf('delete', [{ '0': void 0 }, '1'], { '0': void 0 })

  tf('encode', [{ blah: 1 }], '{"blah":1}')
  tf('encode', [[1, 2]], '[1,2]')
  tf('encode', [12], '12')
  tf('encode', ['12'], '"12"')
  // all nulls are treated the same
  tf('encode', [null], 'null')
  tf('encode', [NaN], 'null')
  tf('encode', [void 0], 'null')
  // use .as("String") rules for other types
  tf('encode', [action], '"[Action]"')
  tf('encode', [/a/ig], '"re#a#gi"');
  (function () {
    tf('encode', [arguments], '{"0":"a","1":"b"}')
  }('a', 'b'))
  // testing it nested
  tf('encode', [{ fn: _.noop, n: NaN, u: void 0 }], '{"fn":"[Function]","n":null,"u":null}')

  // testing indent options
  tf('encode', [{ a: 1, b: 2 }, 0], '{"a":1,"b":2}')
  tf('encode', [{ a: 1, b: 2 }, 4], '{\n    "a": 1,\n    "b": 2\n}')
  tf('encode', [{ a: 1, b: 2 }, '2'], '{\n  "a": 1,\n  "b": 2\n}')
  tf('encode', [{ a: 1, b: 2 }, null], '{"a":1,"b":2}', 'default indent to 0')
  tf('encode', [{ a: 1, b: 2 }, arguments], '{"a":1,"b":2}', 'default indent to 0')
  tf('encode', [{ a: 1, b: 2 }, _.noop], '{"a":1,"b":2}', 'default indent to 0')

  tf('keys', [obj], ['colors', 'pi', 'foo'])
  tf('keys', [obj, ['foo', 'bar']], ['10'])
  tf('keys', [obj, ['pi']], ['0', '1', '2', '3', '4', '5', '6'])
  tf('keys', [obj, ['foo', 'not']], [], 'bad path')
  assertObjNotMutated()
  tf('keys', [['wat', { da: 'heck' }]], ['0', '1'])
  tf('keys', [null], [], 'not a map or array')
  tf('keys', [_.noop], [], 'not a map or array')
  tf('keys', [{ a: 'b' }, 'not-found'], [], 'bad path')

  tf('values', [obj], [
    'many',
    [3, 1, 4, 1, 5, 9, 3],
    { 'bar': { '10': 'I like cheese' } }
  ])
  tf('values', [obj, ['foo', 'bar']], ['I like cheese'])
  tf('values', [obj, ['pi']], [3, 1, 4, 1, 5, 9, 3])
  tf('values', [obj, ['foo', 'not']], [])
  assertObjNotMutated()
  tf('values', [['an', 'array']], ['an', 'array'])
  tf('values', [void 0], [], 'not a map or array')
  tf('values', [_.noop], [], 'not a map or array')

  tf('put', [{ key: 5 }, { foo: 'bar' }], { key: 5, foo: 'bar' })
  tf('put', [{ key: 5 }, [], { foo: 'bar' }], { key: 5, foo: 'bar' })
  tf('put', [{ key: 5 }, ['baz'], { foo: 'bar' }], { key: 5, baz: { foo: 'bar' } })
  tf('put', [{ key: 5 }, ['qux'], 'wat?'], { key: 5, qux: 'wat?' })
  tf('put', [{ key: 5 }, [null], 'wat?'], { key: 5, 'null': 'wat?' })
  tf('put', [{ key: 5 }, [void 0], 'wat?'], { key: 5, 'null': 'wat?' })
  tf('put', [{ key: 5 }, [void 0], 'wat?'], { key: 5, 'null': 'wat?' })
  tf('put', [{ key: 5 }, [NaN], 'wat?'], { key: 5, 'null': 'wat?' })
  tf('put', [{ key: 5 }, [_.noop], 'wat?'], { key: 5, '[Function]': 'wat?' })

  tf('put', [obj, ['foo'], { baz: 'qux' }], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': { 'baz': 'qux' }
  }, 'overwrite at the path, even if to_set and curr val are both maps')
  tf('put', [obj, ['foo', 'bar', 11], 'wat?'], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': {
      'bar': {
        '10': 'I like cheese',
        '11': 'wat?'
      }
    }
  })
  tf('put', [obj, ['foo', 'bar', 10], 'no cheese'], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': {
      'bar': { '10': 'no cheese' }
    }
  })
  tf('put', [obj, { flop: 12 }], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': { 'bar': { '10': 'I like cheese' } },
    'flop': 12
  })
  assertObjNotMutated()
  tf('put', [{}, ['key1'], 'value2'], { key1: 'value2' })
  tf('put', [{}, [], { key2: 'value3' }], { key2: 'value3' })
  tf('put', [{ key: 5 }, 'foo', { key2: 'value3' }], { key: 5, 'foo': { key2: 'value3' } })
  tf('put', [{ key: 5 }, 'key', 7], { key: 7 })
  tf('put', [{ key: 5 }, ['key'], 9], { key: 9 })

  tf('put', [5, ['key'], 9], 5, 'if val is not a Map or Array, return the val')
  tf('put', ['wat', ['key'], 9], 'wat', 'if val is not a Map or Array, return the val')
  tf('put', [null, ['key'], 9], null, 'if val is not a Map or Array, return the val')
  tf('put', [{ a: null, b: void 0 }], { a: null, b: void 0 }, 'if no arguments, return the val')

  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, {}, ['0', '0'], 'foo')),
    '{"0":{"0":"foo"}}',
    "don't use arrays by default, i.e. don't do {\"0\":[\"foo\"]}"
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, {}, [0, 1], 'foo')),
    '{"0":{"1":"foo"}}',
    "don't do {\"0\":[null,\"foo\"]}"
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, [], [0, 0], 'foo')),
    '[{"0":"foo"}]'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, [['wat?']], [0, 0], 'foo')),
    '[["foo"]]',
    'if the nested value is an array, keep it an array'
  )

  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, {}, ['a', 'b'], [])),
    '{"a":{"b":[]}}',
    'preserve type of to_set'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, [], [0], ['foo'])),
    '[["foo"]]',
    'preserve type of to_set'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, [], [], ['foo'])),
    '["foo"]',
    'preserve type of to_set'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, {}, 'foo', [0])),
    '{"foo":[0]}',
    'preserve type of to_set'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, {}, 'foo', ['bar'])),
    '{"foo":["bar"]}',
    'preserve type of to_set'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, [{ foo: 1 }, { bar: 2 }], [1, 'bar', 'baz'], 4)),
    '[{"foo":1},{"bar":{"baz":4}}]'
  )

  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, { one: [2, 3] }, ['one', 1], 4)),
    '{"one":[2,4]}',
    'number index'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, { one: [2, 3] }, ['one', '1'], 4)),
    '{"one":[2,4]}',
    'Array index can be a string'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, { one: [2, 3] }, ['one', '2'], 4)),
    '{"one":[2,3,4]}',
    'Array index at the end'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, { one: [2, 3] }, ['one', '3'], 4)),
    '{"one":{"0":2,"1":3,"3":4}}',
    'convert Array to Map if sparse array is attempted'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, { one: [2, 3] }, ['one', 'foo'], 4)),
    '{"one":{"0":2,"1":3,"foo":4}}',
    'convert Array to Map if non-index path is given'
  )
  t.is(
    JSON.stringify(stdlib['put'](defaultCTX, { one: [2, 3] }, ['one', 'foo', '0'], 4)),
    '{"one":{"0":2,"1":3,"foo":{"0":4}}}',
    'convert Array to Map if non-index path is given'
  )

  tf('get', [obj, ['foo', 'bar', '10']], 'I like cheese')
  tf('get', [obj, 'colors'], 'many')
  tf('get', [obj, ['pi', 2]], 4)
  tf('get', [obj, []], obj)
  tf('get', [obj, null], null)
  assertObjNotMutated()
  tf('get', [['a', 'b', { 'c': ['d', 'e'] }], [2, 'c', 1]], 'e', 'get works on arrays and objects equally')
  tf('get', [['a', 'b', { 'c': ['d', 'e'] }], ['2', 'c', '1']], 'e', 'array indices can be strings')
  tf('get', [{ 'null': 3, 'undefined': 4 }, null], 3)
  tf('get', [{ 'null': 3, 'undefined': 4 }, NaN], 3, 'using KRL toString you get "null"')
  tf('get', [{ 'null': 3, 'undefined': 4 }, undefined], 3)
  tf('get', [{ 'null': 3, 'undefined': 4 }, 'undefined'], 4)

  tf('set', [obj, ['foo', 'baz'], 'qux'], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': {
      'bar': { '10': 'I like cheese' },
      'baz': 'qux'
    }
  })
  tf('set', [obj, 'flop', 12], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': {
      'bar': { '10': 'I like cheese' }
    },
    'flop': 12
  })
  tf('set', [obj, 'colors', ['R', 'G', 'B']], {
    'colors': ['R', 'G', 'B'],
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': {
      'bar': { '10': 'I like cheese' }
    }
  })
  tf('set', [obj, ['foo', 'bar', '10'], 'modified a sub object'], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, 5, 9, 3],
    'foo': {
      'bar': { '10': 'modified a sub object' }
    }
  })
  tf('set', [obj, ['pi', 4, 'a'], 'wat?'], {
    'colors': 'many',
    'pi': [3, 1, 4, 1, { a: 'wat?' }, 9, 3],
    'foo': { 'bar': { '10': 'I like cheese' } }
  })
  tf('set', [obj, [], { a: 1, b: 2 }], { a: 1, b: 2 })
  tf('set', [obj, null, { a: 1, b: 2 }], Object.assign({}, obj, {
    'null': { a: 1, b: 2 }
  }))
  assertObjNotMutated()

  tf('set', [['a', 'b', 'c'], [1], 'wat?'], ['a', 'wat?', 'c'])
  tf('set', [['a', 'b', 'c'], ['1'], 'wat?'], ['a', 'wat?', 'c'])
  tf('set', [[{ a: [{ b: 1 }] }], [0, 'a', 0, 'b'], 'wat?'], [{ a: [{ b: 'wat?' }] }])

  tf('intersection', [[[2], 2, 1, null], [[2], '1', 2, void 0]], [[2], 2, null])
  tf('intersection', [[[0], {}], [[1], []]], [])
  tf('intersection', [[]], [])
  tf('intersection', [[{}]], [])
  tf('intersection', [{}, [{}]], [{}])

  tf('union', [[2], [1, 2]], [2, 1])
  tf('union', [[1, 2], [1, 4]], [1, 2, 4])
  tf('union', [[{ 'x': 2 }], [{ 'x': 1 }]], [{ 'x': 2 }, { 'x': 1 }])
  tf('union', [[]], [])
  tf('union', [[], { 'x': 1 }], [{ 'x': 1 }])
  tf('union', [{ 'x': 1 }, []], [{ 'x': 1 }])
  tf('union', [{ 'x': 1 }], { 'x': 1 })

  tf('difference', [[2, 1], [2, 3]], [1])
  tf('difference', [[2, 1], 2], [1])
  tf('difference', [[{ 'x': 2 }, { 'x': 1 }], [{ 'x': 2 }, { 'x': 3 }]], [{ 'x': 1 }])
  tf('difference', [{ 'x': null }, []], [{ 'x': null }])
  tf('difference', [{ 'x': null }], { 'x': null })

  tf('has', [[1, 2, 3, 4], [4, 2]], true)
  tf('has', [[1, 2, 3, 4], [4, 5]], false)
  tf('has', [[[null, [action]]], [[void 0, [action]]]], true)
  tf('has', [[], []], true)
  tf('has', [[]], true)

  tf('once', [[1, 2, 1, 3, 4, 4]], [2, 3])
  tf('once', [{ 'a': void 0 }], { 'a': void 0 })
  tf('once', [[1, NaN, 'a']], [1, null, 'a'])

  tf('duplicates', [[1, 2, 1, 3, 4, 4]], [1, 4])
  tf('duplicates', [{ '0': 1, '1': 1 }], [])
  tf('duplicates', [[1, 3, null, NaN, void 0, 3]], [3, null])

  tf('unique', [[1, 2, 1, [3], [4], [4]]], [1, 2, [3], [4]])
  tf('unique', [{ '0': 1, '1': 1 }], { '0': 1, '1': 1 })
})

test('klog', function (t) {
  t.plan(4)
  var val = 42
  t.is(stdlib.klog({
    emit: function (kind, obj) {
      t.is(kind, 'klog')
      t.is(obj.val, 42)
      t.is(obj.message, 'message 1')
    }
  }, val, 'message 1'), val)
})

test('defaultsTo - testing debug logging', function (t) {
  var messages = []

  var ctx = {
    emit: function (kind, message) {
      t.is(kind, 'debug')

      messages.push(message)
    }
  }

  t.is(stdlib.defaultsTo(ctx, null, 42), 42, 'no message to log')
  t.true(_.isNaN(stdlib.defaultsTo(ctx, null, NaN, 'message 1')), 'should emit debug')
  t.is(stdlib.defaultsTo(ctx, null, 42, _.noop), 42, 'message should use KRL toString rules')
  t.is(stdlib.defaultsTo(ctx, null, 42, NaN), 42, 'no message to log')
  t.deepEqual(stdlib.defaultsTo(ctx, [void 0]), [void 0])
  t.throws(function () {
    stdlib.defaultsTo(ctx, null)
  }, Error)

  t.deepEqual(messages, [
    '[DEFAULTSTO] message 1',
    '[DEFAULTSTO] [Function]'// message should use KRL toString rules
  ])
})
