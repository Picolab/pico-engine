var _ = require('lodash')
var declarationBlock = require('../utils/declarationBlock')
const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  var rs = {
    rid: comp(ast.rid),
    version: e('str', 'TODO')
  }
  const shares = []
  if (ast.meta) {
    rs.meta = comp(ast.meta)
    _.each(ast.meta.properties, function (prop) {
      if (prop.key.value === 'shares') {
        _.each(prop.value.ids, function (id) {
          shares.push(id.value)
        })
      }
    })
  }

  const initBody = declarationBlock(ast.global, comp)

  initBody.push(e('const', '$rs', e('new', e('id', '$krl.SelectWhen'), [])))

  const rulesObj = {}
  _.each(ast.rules, function (rule) {
    if (rulesObj[rule.name.value]) {
      throw comp.error(rule.name.loc, 'Duplicate rule name: ' + rule.name.value)
    }
    rulesObj[rule.name.value] = true
    initBody.push(comp(rule))
  })

  const testingJSON = {
    queries: [],
    events: []
  }

  const queries = {}
  for (const share of shares) {
    queries[share] = e('id', jsIdent(share))
    testingJSON.queries.push({
      name: share,
      args: []// TODO use symbol-table to track these
    })
  }
  queries['__testing'] = e('fn', [], [e('return', e('json', testingJSON))])

  initBody.push(e('return', e('obj', {
    event: e('asyncfn', ['event'], [
      e(';', e('acall', e('id', '$rs.send'), [e('id', 'event')]))
    ]),
    query: e('obj', queries)
  })))

  rs.init = e('asyncfn', ['$ctx'], initBody)

  return [
    e(';', e('=', e('id', 'module.exports'), e('obj', rs)))
  ]
}
