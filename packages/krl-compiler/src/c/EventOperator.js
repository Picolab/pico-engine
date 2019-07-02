module.exports = function (ast, comp, e) {
  const args = ast.args.map(arg => {
    return comp(arg)
  })

  switch (ast.op) {
    case 'or':
    case 'and':
    case 'before':
    case 'then':
    case 'after':
    case 'between':
    case 'any':
      return e('call', e('id', `$env.SelectWhen.${ast.op}`), args)
    case 'not between':
      return e('call', e('id', `$env.SelectWhen.notBetween`), args)
  }

  throw new Error('EventOperator.op not supported: ' + ast.op)
}
