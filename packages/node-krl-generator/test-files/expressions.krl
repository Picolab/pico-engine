ruleset expressions {
  rule MemberExpression {
    select when a b
    always {
      a.b()
    }
  }
}
