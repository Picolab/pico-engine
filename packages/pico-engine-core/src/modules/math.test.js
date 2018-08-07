var test = require('tape')
var kmath = require('./math')().def

var testErr = require('../testErr')

test('module - math:*', function (t) {
  (async function () {
    var terr = testErr(t, kmath)

    t.equals(await kmath.base64encode({}, ['}{']), 'fXs=', 'base64encode')
    t.equals(await kmath.base64encode({}, [null]), await kmath.base64encode({}, ['null']), 'base64encode coreces to strings')

    await terr('base64encode', {}, [], 'Error: math:base64encode needs a str string')

    t.equals(await kmath.base64decode({}, ['fXs=']), '}{', 'base64decode')

    await terr('base64decode', {}, [], 'Error: math:base64decode needs a str string')

    t.ok(Array.isArray(kmath.hashAlgorithms))

    t.equals(
      await kmath.hash({}, ['sha256', 'hello']),
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      'sha256 "hello"'
    )
    t.equals(
      await kmath.hash({}, ['sha256', 'hello', 'base64']),
      'LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
      'sha256 "hello" base64'
    )
    t.equals(
      await kmath.hash({}, ['sha256', null]),
      await kmath.hash({}, ['sha256', 'null']),
      'sha2 coerces inputs to Strings'
    )
    t.equals(
      await kmath.hash({}, ['sha256', [1, 2]]),
      await kmath.hash({}, ['sha256', '[Array]']),
      'sha2 coerces inputs to Strings'
    )

    await terr('hash', {}, [], 'Error: math:hash needs a algorithm string')
    await terr('hash', {}, [0], 'Error: math:hash needs a str string')
    await terr('hash', {}, [0, null], 'TypeError: math:hash was given 0 instead of a algorithm string')
    await terr('hash', {}, ['0', null], "Error: math:hash doesn't recognize the hash algorithm 0")

    t.equals(
      await kmath.hmac({}, ['sha256', 'a secret', 'some message']),
      '86de43245b44531ac38b6a6a691996287d932a8dea03bc69b193b90caf48ff53'
    )
    t.equals(
      await kmath.hmac({}, ['sha256', 'a secret', 'some message', 'base64']),
      'ht5DJFtEUxrDi2pqaRmWKH2TKo3qA7xpsZO5DK9I/1M='
    )
    await terr('hmac', {}, [], 'Error: math:hmac needs a algorithm string')
    await terr('hmac', {}, ['foo', '', ''], 'Error: math:hmac doesn\'t recognize the hash algorithm foo')
  }()).then(t.end).catch(t.end)
})
