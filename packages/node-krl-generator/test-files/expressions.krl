ruleset expressions {
  rule ArrayAndMapLiterals {
    select when a b
    always {
      ["1", 2, three];
      {"one": 1, "two": 2}
    }
  }
  rule MemberExpression {
    select when a b
    always {
      a.b.c.d();
      obj{["some", "path"]};
      matrix[i][j]
    }
  }
}
