ruleset expressions {
  meta {
    description <<
1 + 2 = #{1 + 2}
some object path: #{obj{["some", "path"]}}
escape close: >\>
    >>
  }
  rule ArrayAndMapLiterals {
    select when a b
    always {
      ["1", true, three, 4, false];
      {"one": 1, "two": 2}
    }
  }
  rule MemberExpression {
    select when a b
    always {
      a.b.c.d();
      obj{["some", "path"]};
      obj{other{call.some.fn[0]("cool")}};
      matrix[i][j]
    }
  }
  rule ConditionalExpression {
    select when a b
    always {
      a => b |
        not c;
      a => b |
      c => d |
      e => f |
        -g
    }
  }
  rule Functions {
    select when a b
    always {
      add = function(a, b){
        other = b;
        a + other
      };
      add(1, 2)
    }
  }
  rule OperatorPrecedence {
    select when a b
    always {
      a + (b * c);
      (a * b) + c;
      a * (b + c);
      (a + b) * c
    }
  }
}
