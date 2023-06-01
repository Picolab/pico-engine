var rmLoc = require("./test/helpers/rmLoc");
var parser = require("./dist/src");
var normalizeAST = require("./test/helpers/normalizeAST");

var ruleExample = function(src) {
  return function() {
    var ast = parser("ruleset rs{" + src + "}");
    return [src, ast.rules[0]];
  };
};

var EventExpExample = function(src) {
  return function() {
    var ast = parser("ruleset rs{rule r0{" + src + "}}");
    return [src, ast.rules[0].select.event];
  };
};

var examples = {
  "### Ruleset": [
    "ruleset io.picolabs.hello {\n}",
    [
      "ruleset io.picolabs.hello {",
      "  meta {",
      '    name "Hello World"',
      "    description <<",
      "Hello parser!",
      ">>",
      "  }",
      "  global {",
      "    a = 1",
      "  }",
      "}"
    ].join("\n")
  ],
  "### Rule": [
    ruleExample("rule NAME {\n}"),
    ruleExample("rule NAME is inactive {\n}"),
    ruleExample(
      [
        "rule hello {",
        "  select when DOMAIN TYPE",
        "",
        "  pre {",
        "    a = 1",
        "  }",
        "",
        "  choose COND {",
        "    one =>",
        "      action(1)",
        "    two =>",
        "      action(2)",
        "  }",
        "",
        "  fired {",
        '    raise event "it:fired"',
        "  }",
        "}"
      ].join("\n")
    )
  ],
  "### EventExpression": [
    EventExpExample("select when A B"),
    EventExpExample("select when A B attr re#^(.*)$# setting(val)"),
    EventExpExample("select when A A or B B"),
    EventExpExample("select when any 2 (A A, B B, C C)")
  ],
  "### KRL Expression language": [],
  "#### Literals": [
    '"hello world"',
    "-12.3",
    "thing",
    "ent:name",
    "true",
    "re#^My name is (.*)#i",
    "[A, B, C]",
    '{"one": A}',
    "<<\n  hello #{name}!\n  >>",
    '<< This #{ x{"flip"} } that >>'
  ],
  "#### Declaration": ["A = B"],
  "#### Infix Operators": [
    "A && B",
    "A + B + C",
    "A + B * C",
    "A < B",
    "A cmp B",
    "A <=> B"
  ],
  "#### Conditionals": ["A => B | C", "A => B |\nC => D |\n     E"],
  "#### Functions": ["function(A, B = 3){\n  C\n}", "A(B,C)"],
  "#### Accessing data": ["matrix[i][j]", 'some_hash{["some", "path"]}']
};

var ind = function(n) {
  var s = "";
  var i;
  for (i = 0; i < n; i++) {
    s += " ";
  }
  return s;
};

var printAST = function(ast, i, indentSize) {
  indentSize = indentSize || 2;
  if (Array.isArray(ast)) {
    var arrStrs = ast.map(function(ast) {
      return printAST(ast, i + indentSize, indentSize);
    });
    var flatArray = "[ " + arrStrs.join(" , ") + " ]";
    if (flatArray.indexOf("\n") < 0 && flatArray.length < 20) {
      return flatArray;
    }
    return (
      "[\n" +
      arrStrs
        .map(function(str) {
          return ind(i + indentSize) + str;
        })
        .join(",\n") +
      "\n" +
      ind(i) +
      "]"
    );
  }
  if (Object.prototype.toString.call(ast) === "[object Object]") {
    if (ast.type === "Identifier" && /^[A-Z]+$/.test(ast.value)) {
      return ast.value;
    }
    if (
      i !== 0 &&
      [
        "String",
        "Number",
        "Boolean",
        "Identifier",
        "RegExp",
        "Keyword"
      ].includes(ast.type)
    ) {
      var v = ast.type === "RegExp" ? ast.value : JSON.stringify(ast.value);
      return "{value: " + v + ', type:"' + ast.type + '"}';
    }
    return (
      "{\n" +
      Object.keys(ast)
        .map(key => {
          var value = ast[key];
          var k = JSON.stringify(key);
          var v = printAST(value, i + indentSize, indentSize);
          if (key === "value" && ast.type === "RegExp") {
            v = ast.value;
          }
          return ind(i + indentSize) + k + ": " + v;
        })
        .join(",\n") +
      "\n" +
      ind(i) +
      "}"
    );
  }
  return JSON.stringify(ast);
};

/// /////////////////////////////////////////////////////////////////////////////
console.log("# KRL AST Specification");
console.log();
console.log("### Node");
console.log("All AST nodes implement `Node`");
console.log("```js");
console.log("interface Node {");
console.log("  type: string;");
console.log("  loc: SourceLocation | null;");
console.log("}");
console.log("```");
console.log("```js");
console.log("interface SourceLocation {");
console.log("  start: integer;");
console.log("  end: integer;");
console.log("}");
console.log("```");
console.log(
  "`start` and `end` are character indexes (starting at 0) from the source string."
);
console.log();
console.log("The following examples omit the `loc` property for brevity.");
Object.keys(examples).forEach(function(head) {
  const srcs = examples[head];
  console.log();
  console.log(head);
  if (!srcs || srcs.length === 0) {
    return;
  }
  console.log();
  console.log(
    "```js\n" +
      srcs
        .map(function(src) {
          var ast;
          if (typeof src === "function") {
            var srcAst = src();
            src = srcAst[0];
            ast = srcAst[1];
          } else {
            ast = parser(src);
          }
          ast = normalizeAST(rmLoc(ast));
          ast = Array.isArray(ast) && ast.length === 1 ? ast[0] : ast;
          return src + "\n" + printAST(ast, 0, 2);
        })
        .join("\n\n") +
      "\n```"
  );
});
