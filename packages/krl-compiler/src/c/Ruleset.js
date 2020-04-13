var _ = require('lodash')
var declarationBlock = require('../utils/declarationBlock')
const jsIdent = require('../utils/jsIdent')

module.exports = function (ast, comp, e) {
  var rs = {
    rid: comp(ast.rid),
    version: ast.version ? comp(ast.version) : e('str', 'draft')
  }

  let esBody = []
  esBody.push(e('const', '$default', e('call', e('id', 'Symbol'), [e('str', 'default')])))
  esBody.push(e('const', '$ctx', e('call', e('id', '$env.mkCtx'), [e('id', '$rsCtx')])))
  esBody.push(e('const', '$stdlib', e('call', e('id', '$ctx.module'), [e('str', 'stdlib')])))

  const shares = []
  const provides = []
  if (ast.meta) {
    rs.meta = comp(ast.meta)
    _.each(ast.meta.properties, function (prop) {
      if (prop.key.value === 'shares') {
        _.each(prop.value.ids, function (id) {
          shares.push(id.value)
        })
      } else if (prop.key.value === 'provides') {
        _.each(prop.value.ids, function (id) {
          provides.push(id)
        })
      } else if (prop.key.value === 'configure') {
        for (const dec of prop.value.declarations) {
          const estree = comp(dec.right)
          comp.scope.set(dec.left.value, estree.$$Annotation || { type: 'Unknown' })
          esBody.push(e('const', jsIdent(dec.left.value), e('call', e('id', '$env.configure', dec.loc), [
            e('str', dec.left.value, dec.left.loc),
            estree
          ], dec.loc), dec.left.loc))
        }
      } else if (prop.key.value === 'use') {
        const ast = prop.value
        if (ast.kind !== 'module') {
          throw comp.error(ast.loc, `use ${ast.kind} is not supported`)
        }
        const args = [
          e('str', ast.rid.value, ast.rid.loc),
          ast.version ? comp(ast.version) : e('null', ast.rid.loc),
          ast.alias
            ? e('str', ast.alias.value, ast.alias.loc)
            : e('str', ast.rid.value, ast.rid.loc)
        ]
        if (ast['with']) {
          const withObj = {}
          for (const dec of ast['with']) {
            withObj[dec.left.value] = comp(dec.right)
          }
          args.push(e('obj', withObj, ast.loc))
        }
        esBody.push(e(';', e('call', e('id', '$env.useModule', prop.loc), args, prop.loc), prop.loc))
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

  _.each(comp.idsOutOfScope, function (ast, id) {
    esBody.push(e('const', jsIdent(id), e('get', e('id', '$stdlib', ast.loc), e('str', id, ast.loc), ast.loc), ast.loc))
  })

  esBody = esBody.concat(esBodyGlobal)
  esBody = esBody.concat(esBodyRules)

  const returnObj = {
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
      },
      e('return', e('call', e('id', '$ctx.drainDirectives'), []))
    ]),
    query: e('obj', queries)
  }

  if (provides.length > 0) {
    const provideObj = {}
    for (const provide of provides) {
      const annotation = comp.scope.get(provide.value)
      if (!annotation) {
        throw comp.error(provide.loc, 'Trying to provide: ' + provide.value + ' but it\'s not defined in global')
      }
      provideObj[provide.value] = e('id', jsIdent(provide.value))
    }
    returnObj.provides = e('obj', provideObj)
  }

  esBody.push(e('return', e('obj', returnObj)))

  rs.init = e('asyncfn', ['$rsCtx', '$env'], esBody)

  return [
    e(';', e('=', e('id', 'module.exports'),
      e('obj', rs)
    ))
  ]
}
