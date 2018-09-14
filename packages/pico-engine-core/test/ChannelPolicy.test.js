var test = require('ava')
var ChannelPolicy = require('../src/ChannelPolicy')

test('policy = ChannelPolicy.clean(policy)', function (t) {
  var cleanIt = ChannelPolicy.clean

  try {
    cleanIt(null)
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'TypeError: Policy definition should be a Map, but was Null')
  }
  try {
    cleanIt({})
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing `policy.name`')
  }
  try {
    cleanIt({ name: '  ' })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: missing `policy.name`')
  }

  try {
    cleanIt({
      name: 'foo',
      event: { allow: '*' }
    })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: `policy.event.<allow|deny>` must be an Array of rules')
  }
  try {
    cleanIt({
      name: 'foo',
      query: { allow: 'ALL' }
    })
    t.fail('should throw')
  } catch (e) {
    t.is(e + '', 'Error: `policy.query.<allow|deny>` must be an Array of rules')
  }

  try {
    cleanIt({
      name: 'foo',
      event: { allow: ['wat'] }
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy rules must be Maps, not String')
  }
  try {
    cleanIt({
      name: 'foo',
      query: { allow: ['wat'] }
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy rules must be Maps, not String')
  }
  try {
    cleanIt({
      name: 'foo',
      bar: { allow: ['wat'] },
      baz: true
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy does not support properties: bar, baz')
  }
  try {
    cleanIt({
      name: 'foo',
      event: { allow: [{}], wat: [] }
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy.event does not support properties: wat')
  }
  try {
    cleanIt({
      name: 'foo',
      query: { allow: [{}], wat: [] }
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy.query does not support properties: wat')
  }
  try {
    cleanIt({
      name: 'foo',
      event: { allow: [{ wat: 1 }] }
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy.event rule does not support properties: wat')
  }
  try {
    cleanIt({
      name: 'foo',
      query: { allow: [{ wat: 1 }] }
    })
    t.fail('should throw..')
  } catch (e) {
    t.is(e + '', 'Error: Policy.query rule does not support properties: wat')
  }

  t.deepEqual(cleanIt({
    name: 'foo'
  }), {
    name: 'foo',
    event: {
      deny: [],
      allow: []
    },
    query: {
      deny: [],
      allow: []
    }
  })

  t.deepEqual(cleanIt({
    name: 'foo',
    event: { allow: [{}] }
  }), {
    name: 'foo',
    event: {
      deny: [],
      allow: [{}]
    },
    query: {
      deny: [],
      allow: []
    }
  })

  t.deepEqual(cleanIt({
    name: ' foo   ',
    event: {
      allow: [
        { domain: 'one ', type: 'thrEE' },
        { domain: '  fIVe ' },
        { type: '\tsix ' }
      ]
    }
  }), {
    name: 'foo',
    event: {
      deny: [],
      allow: [
        { domain: 'one', type: 'thrEE' },
        { domain: 'fIVe' },
        { type: 'six' }
      ]
    },
    query: {
      deny: [],
      allow: []
    }
  })

  t.deepEqual(cleanIt({
    name: ' foo   ',
    query: {
      allow: [
        { rid: 'one ', name: 'thrEE' },
        { rid: '  fIVe ' },
        { name: '\tsix ' }
      ]
    }
  }), {
    name: 'foo',
    event: {
      deny: [],
      allow: []
    },
    query: {
      deny: [],
      allow: [
        { rid: 'one', name: 'thrEE' },
        { rid: 'fIVe' },
        { name: 'six' }
      ]
    }
  })
})
