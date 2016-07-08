ruleset io.picolabs.operators {
  meta {
    shares results
  }
  global {
    nothing = null
    some_string = "foo"
    results = {
      "str_as_num": "100.25".as("Number"),
      "num_as_str": 1.05.as("String"),
      "regex_as_str": re#blah#i.as("String"),
      "isnull": [
        1.isnull(),
        some_string.isnull(),
        nothing.isnull()
      ],
      "hello_cap": "Hello World".capitalize(),
      "hello_low": "Hello World".lc()
    }
  }
}
