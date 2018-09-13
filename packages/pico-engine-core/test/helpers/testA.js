var test = require('tape')

function testA (name, fn) {
  test(name, function (t) {
    t.is = t.deepEquals
    Promise.resolve(fn(t))
      .then(t.end)
      .catch(t.end)
  })
}
testA.only = function testAonly (name, fn) {
  test.only(name, function (t) {
    t.is = t.deepEquals
    Promise.resolve(fn(t))
      .then(t.end)
      .catch(t.end)
  })
}
testA.cb = function testAcb (name, fn) {
  test(name, function (t) {
    t.is = t.deepEquals
    fn(t)
  })
}

module.exports = testA
