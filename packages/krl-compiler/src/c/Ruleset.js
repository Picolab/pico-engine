var _ = require('lodash')
var declarationBlock = require('../utils/declarationBlock')
const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  var rs = {
    rid: comp(ast.rid),
    version: ast.version ? comp(ast.version) : e('str', 'draft')
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

  initBody.unshift(e('const', '$ctx', e('call', e('id', '$env.mkCtx'), [e('id', '$rsCtx')])))

  initBody.push(e('const', '$rs', e('new', e('id', '$env.SelectWhen.SelectWhen'), [])))

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
    events: comp.eventScope.getTestingJSON()
  }

  const queries = {}
  for (const share of shares) {
    queries[share] = e('fn', ['$args'], [
      e('return', e('call', e('id', jsIdent(share)), [e('id', '$ctx'), e('id', '$args')]))
    ])
    const annotation = comp.scope.get(share)
    testingJSON.queries.push({
      name: share,
      args: annotation && annotation.type === 'Function'
        ? annotation.params
        : []
    })
  }
  queries['__testing'] = e('fn', [], [e('return', e('json', testingJSON))])

  initBody.push(e('return', e('obj', {
    event: e('asyncfn', ['event'], [
      e(';', e('acall', e('id', '$rs.send'), [e('id', 'event')]))
    ]),
    query: e('obj', queries)
  })))

  rs.init = e('asyncfn', ['$rsCtx', '$env'], initBody)

  return [
    e(';', e('=', e('id', 'module.exports'),
      e('obj', rs)
    ))
  ]
}
