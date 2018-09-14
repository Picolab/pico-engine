var test = require('ava')
var cleanQuery = require('../src/cleanQuery')

test('query = cleanQuery(query)', function (t) {
  try {
    cleanQuery()
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.eci')
  }
  try {
    cleanQuery({ eci: 0 })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.eci')
  }
  try {
    cleanQuery({ eci: '' })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.eci')
  }
  try {
    cleanQuery({ eci: '  ' })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.eci')
  }
  try {
    cleanQuery({ eci: 'eci-1', rid: '' })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.rid')
  }
  try {
    cleanQuery({ eci: 'eci-1', rid: 'foo' })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.name')
  }
  try {
    cleanQuery({ eci: 'eci-1', rid: 'foo', name: ' ' })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing query.name')
  }

  // bare minimum
  t.deepEqual(cleanQuery({
    eci: 'eci123',
    rid: 'foo',
    name: 'bar'
  }), {
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    args: {}
  })

  // args - should not be mutable
  var args = { what: { is: ['this'] } }
  var query = cleanQuery({
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    args: args
  })
  t.deepEqual(query, {
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    args: args
  })
  t.deepEqual(query.args, args, 'they should match before query.args mutates')
  query.args.what = 'blah'
  t.notDeepEqual(query.args, args, 'oops, args was mutable')

  // trim up inputs
  t.deepEqual(cleanQuery({
    eci: '  eci123   ',
    rid: '  foo\n ',
    name: '  \t bar  ',
    args: { ' foo ': " don't trim these   " }
  }), {
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    args: { ' foo ': " don't trim these   " }
  })

  // no timestamp
  t.deepEqual(cleanQuery({
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    timestamp: new Date()
  }), {
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    args: {}
  })

  // no for_rid
  t.deepEqual(cleanQuery({
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    for_rid: 'rid'
  }), {
    eci: 'eci123',
    rid: 'foo',
    name: 'bar',
    args: {}
  })

  var testAttrs = function (input, output, msg) {
    t.deepEqual(cleanQuery({
      eci: 'eci123',
      rid: 'foo',
      name: 'bar',
      args: input
    }).args, output, msg)
  }

  testAttrs({
    fn: function () {}
  }, {
    fn: '[Function]'
  }, 'convert args via KRL json encode')

  testAttrs(function () {}, {}, 'args must be a map or array')

  testAttrs(
    [0, 1, 'a', null, void 0, NaN],
    [0, 1, 'a', null, null, null],
    "args normalize to JSON null's"
  )

  testAttrs(
    { a: null, b: void 0, c: NaN },
    { a: null, b: null, c: null },
    "args normalize to JSON null's"
  );

  (function () {
    testAttrs(
      arguments,
      { '0': 'foo', '1': 'bar' },
      'non "plain" objects should work as Maps'
    )
  }('foo', 'bar'))
})
