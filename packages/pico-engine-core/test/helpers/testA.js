var test = require('tape')

module.exports = function testA (name, fn) {
  test(name, function (t) {
    t.is = t.deepEquals
    fn(t)
      .then(t.end)
      .catch(t.end)
  })
}
