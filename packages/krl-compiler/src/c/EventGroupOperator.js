module.exports = function (ast, comp, e) {
  let op
  switch (ast.op) {
    case 'count':
    case 'repeat':
      op = e('id', '$env.SelectWhen.' + ast.op)
      break
    default:
      throw comp.error('EventGroupOperator.op not supported: ' + ast.op)
  }
  return e('call', op, [comp(ast.n), comp(ast.event)])
}
