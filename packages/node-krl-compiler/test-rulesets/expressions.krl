ruleset io.picolabs.expressions {
  meta {
    shares obj, path1, path2
  }
  global {
    cond_exp_1 = true => 1 | 2
    cond_exp_2 = false => 1 | 2
    obj = {"a": 1, "b": {"c": [2, 3, 4, {"d": {"e": 5}}, 6, 7]}}
    path1 = obj{["b", "c", 3, "d"]}
    path2 = obj{["b", "c", 5]}
    obj{["b", "c", 3, "d"]} = 4
  }
}
