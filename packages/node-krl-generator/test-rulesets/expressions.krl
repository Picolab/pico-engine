ruleset io.picolabs.expressions {
  meta {
    shares obj, path1, path2, index1, index2
  }
  global {
    cond_exp_1 = true => 1 |
      2
    cond_exp_2 = false => 1 |
      2
    obj = {
      "a": 1,
      "b": {"c": [2, 3, 4, {"d": {"e": 5}}, 6, 7]}
    }
    obj{["b", "c", 3, "d", "e"]} = "changed 5"
    obj["a"] = "changed 1"
    path1 = obj{["b", "c", 3, "d"]}
    path2 = obj{["b", "c", 5]}
    index1 = obj["a"]
    index2 = obj["b"]["c"][1]
    not_true = not true
    not_null = not null
    true_or_false = true || false
    true_and_false = true && false
  }

}
