module.exports = function (ast, comp, e) {
  if (ast.condition === 'on final') {
    return e('if',
      e('||',
        // if not inside a foreach, consider it true
        e('===', e('typeof', e('id', 'foreach_is_final')), e('string', 'undefined')),
        // inside a foreach `foreach_is_final` is defined
        e('id', 'foreach_is_final')
      ),
      comp(ast.statement)
    )
  }

  return e('if',
    comp(ast.condition),
    comp(ast.statement)
  )
}
