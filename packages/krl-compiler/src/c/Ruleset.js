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

  const esBodyGlobal = declarationBlock(ast.global, comp)

  const esBodyRules = []
  esBodyRules.push(e('const', '$rs', e('new', e('id', '$env.SelectWhen.SelectWhen'), [])))
  const rulesObj = {}
  _.each(ast.rules, function (rule) {
    if (rulesObj[rule.name.value]) {
      throw comp.error(rule.name.loc, 'Duplicate rule name: ' + rule.name.value)
    }
    rulesObj[rule.name.value] = true
    esBodyRules.push(comp(rule))
  })

  const testingJSON = {
    queries: [],
    events: comp.eventScope.getTestingJSON()
  }

  const queries = {}
  for (const share of shares) {
    const annotation = comp.scope.get(share)
    if (annotation && annotation.type === 'Function') {
      queries[share] = e('fn', ['$args'], [
        e('return', e('call', e('id', jsIdent(share)), [e('id', '$ctx'), e('id', '$args')]))
      ])
      testingJSON.queries.push({
        name: share,
        args: annotation.params
      })
    } else if (annotation && annotation.type === 'Action') {
      throw comp.error(annotation.loc, 'Actions cannot be used queries: ' + share)
    } else {
      queries[share] = e('fn', ['$args'], [
        e('return', e('id', jsIdent(share)))
      ])
      testingJSON.queries.push({
        name: share,
        args: []
      })
    }
  }
  queries['__testing'] = e('fn', [], [e('return', e('json', testingJSON))])

  let esBody = []
  esBody.push(e('const', '$default', e('call', e('id', 'Symbol'), [e('str', 'default')])))
  esBody.push(e('const', '$ctx', e('call', e('id', '$env.mkCtx'), [e('id', '$rsCtx')])))
  esBody.push(e('const', '$stdlib', e('call', e('id', '$ctx.module'), [e('str', 'stdlib')])))

  _.each(comp.idsOutOfScope, function (ast, id) {
    esBody.push(e('const', jsIdent(id), e('get', e('id', '$stdlib', ast.loc), e('str', id, ast.loc), ast.loc), ast.loc))
  })

  esBody = esBody.concat(esBodyGlobal)
  esBody = esBody.concat(esBodyRules)

  esBody.push(e('return', e('obj', {
    event: e('asyncfn', ['event', 'eid'], [
      e(';', e('call', e('id', '$ctx.setEvent'), [e('call', e('id', 'Object.assign'), [
        e('obj', {}),
        e('id', 'event'),
        e('obj', { eid: e('id', 'eid') })
      ])])),
      {
        type: 'TryStatement',
        block: e('block', [
          e(';', e('acall', e('id', '$rs.send'), [e('id', 'event')]))
        ]),
        finalizer: e('block', [
          e(';', e('call', e('id', '$ctx.setEvent'), [e('null')]))
        ])
      }
    ]),
    query: e('obj', queries)
  })))

  rs.init = e('asyncfn', ['$rsCtx', '$env'], esBody)

  return [
    e(';', e('=', e('id', 'module.exports'),
      e('obj', rs)
    ))
  ]
}
