var test = require('ava')
var ktypes = require('krl-stdlib/types')
var krandom = require('../../src/modules/random')().def

var assertNumRange = function (n, low, high, shouldBeInt) {
  if (ktypes.isNumber(n) && (n >= low) && (n <= high)) {
    if (shouldBeInt && (n % 1 !== 0)) {
      throw new Error('not an int: ' + n)
    }
    return true
  }
  throw new Error('invalid number range: ' + low + ' <= ' + n + ' <= ' + high)
}

test('module - random:*', async function (t) {
  var i
  for (i = 0; i < 5; i++) {
    t.truthy(/^c[^\s]+$/.test(await krandom.uuid({}, [])))
    t.truthy(/^[^\s]+$/.test(await krandom.word({}, [])))
  }

  // just throwup when there is a fail, so we don't polute the tap log with 100s of asserts
  var n
  for (i = 0; i < 100; i++) {
    n = await krandom.integer({}, [])
    assertNumRange(n, 0, 1, true)

    n = await krandom.integer({}, [0])
    assertNumRange(n, 0, 0, true)

    n = await krandom.integer({}, [10])
    assertNumRange(n, 0, 10, true)

    n = await krandom.integer({}, [-7])
    assertNumRange(n, -7, 0, true)

    n = await krandom.integer({}, [-3, 5])
    assertNumRange(n, -3, 5, true)

    n = await krandom.integer({}, [-3, 'five'])
    assertNumRange(n, -3, 0, true)

    n = await krandom.integer({}, ['4.49', -8])
    assertNumRange(n, -8, 4, true)

    n = await krandom.integer({}, ['four', -8.49])
    assertNumRange(n, -8, 0, true)

    n = await krandom.number({}, [])
    assertNumRange(n, 0, 1)

    n = await krandom.number({}, [0])
    assertNumRange(n, 0, 0)

    n = await krandom.number({}, [7])
    assertNumRange(n, 0, 7)

    n = await krandom.number({}, [-1.2])
    assertNumRange(n, -1.2, 0)

    n = await krandom.number({}, [-3, 5])
    assertNumRange(n, -3, 5)

    n = await krandom.integer({}, [-3, 'five'])
    assertNumRange(n, -3, 0, true)

    n = await krandom.integer({}, ['four', -8])
    assertNumRange(n, -8, 0, true)

    n = await krandom.number({}, [9.87, '-3.6'])
    assertNumRange(n, -3.6, 9.87)
  }
  // if an assert hasn't thrown up by now, we're good
  t.truthy(true, 'random:integer passed')
  t.truthy(true, 'random:number passed')
})
