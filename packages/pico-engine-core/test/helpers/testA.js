var test = require('tape')

function convT (t) {
  return {
    end: t.end,
    plan: t.plan,
    fail: t.fail,
    truthy: t.ok,
    falsy: t.notOk,
    is: t.equals,
    not: t.notEqual,
    deepEqual: t.deepEqual,
    notDeepEqual: t.notDeepEqual
  }
}

function testA (name, fn) {
  test(name, function (t) {
    Promise.resolve(fn(convT(t)))
      .then(t.end)
      .catch(t.end)
  })
}
testA.only = function testAonly (name, fn) {
  test.only(name, function (t) {
    Promise.resolve(fn(convT(t)))
      .then(t.end)
      .catch(t.end)
  })
}
testA.cb = function testAcb (name, fn) {
  test(name, function (t) {
    fn(convT(t))
  })
}

module.exports = testA
