module.exports = function (ast, comp, e) {
  // undefined is the true "null" in javascript
  // however, undefined can be re-assigned. So `void 0` returns undefined but can"t be re-assigned
  return e('void', e('number', 0))
}
