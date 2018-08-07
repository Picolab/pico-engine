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

    t.ok(await kmath.hashFunctions({}, []), 'hashFunctions should return something')

    t.equals(
      await kmath.hash({}, ['sha256', 'hello']),
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      'sha256 "hello"'
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

    await terr('hash', {}, [], 'Error: math:hash needs a hashFn string')
    await terr('hash', {}, [0], 'Error: math:hash needs a toHash string')
    await terr('hash', {}, [0, null], 'TypeError: math:hash was given 0 instead of a hashFn string')
    await terr('hash', {}, ['0', null], "Error: math:hash doesn't recognize the hash algorithm 0")

    t.equals(
      await kmath.hmac({}, ['sha256', 'a secret', 'some data to hash']),
      '7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e'
    )
    t.equals(
      await kmath.hmac({}, ['sha256', 'a secret', 'some data to hash', 'base64']),
      'f9BN+S9jb9RQvIQclBjlglwX8zrZyHxRgRWkWXH3934='
    )
    await terr('hmac', {}, [], 'Error: math:hmac needs a hashFn string')
    await terr('hmac', {}, ['foo', '', ''], 'Error: math:hmac doesn\'t recognize the hash algorithm foo')
  }()).then(t.end).catch(t.end)
})
