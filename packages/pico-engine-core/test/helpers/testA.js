var test = require('tape')

function testA (name, fn) {
  test(name, function (t) {
    t.is = t.deepEquals
    fn(t)
      .then(t.end)
      .catch(t.end)
  })
}
testA.only = function testAonly (name, fn) {
  test.only(name, function (t) {
    t.is = t.deepEquals
    fn(t)
      .then(t.end)
      .catch(t.end)
  })
}

module.exports = testA
