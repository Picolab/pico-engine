var _ = require("lodash");
var rmLoc = require("./rmLoc");
var parser = require("../src/");
var normalizeAST = require("./normalizeASTForTestCompare");

var ruleExample = function(src){
    return function(){
        var ast = parser("ruleset rs{" + src + "}");
        return [src, ast.rules[0]];
    };
};

var EventExpExample = function(src){
    return function(){
        var ast = parser("ruleset rs{rule r0{" + src + ";}}");
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
        ruleExample([
            "rule hello {",
            "  select when DOMAIN TYPE",
            "",
            "  pre {",
            "    a = 1",
            "  }",
            "",
            "  if COND then",
            "    choose",
            "      one =>",
            "         action(1)",
            "      two =>",
            "         action(2)",
            "",
            "  fired {",
            "    FIRED",
            "  }",
            "}"
        ].join("\n"))
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
    "#### Declaration": [
        "A = B"
    ],
    "#### Infix Operators": [
        "A && B",
        "A + B + C",
        "A + B * C",
        "A < B",
        "A cmp B",
        "A <=> B"
    ],
    "#### Conditionals": [
        "A => B | C",
        "A => B |\nC => D |\n     E"
    ],
    "#### Functions": [
        "function(A){\n  B\n}",
        "A(B,C)"
    ],
    "#### Accessing data": [
        "matrix[i][j]",
        'some_hash{["some", "path"]}'
    ]
};

var ind = function(n){
    var s = "";
    var i;
    for(i = 0; i < n; i++){
        s += " ";
    }
    return s;
};

var printAST = function(ast, i, indent_size){
    indent_size = indent_size || 2;
    if(_.isArray(ast)){
        var arr_strs = _.map(ast, function(ast){
            return printAST(ast, i + indent_size, indent_size);
        });
        var flat_array = "[ " + arr_strs.join(" , ") + " ]";
        if((flat_array.indexOf("\n") < 0) && (flat_array.length < 20)){
            return flat_array;
        }
        return "[\n"
            + _.map(arr_strs, function(str){
                return ind(i + indent_size) + str;
            }).join(",\n")
            + "\n" + ind(i) + "]";
    }
    if(_.isPlainObject(ast)){
        if(ast.type === "Identifier" && /^[A-Z]+$/.test(ast.value)){
            return ast.value;
        }
        if(i !== 0 && _.includes(["String", "Number", "Boolean", "Identifier", "RegExp", "Keyword"], ast.type)){
            var v = ast.type === "RegExp"
                ? ast.value
                : JSON.stringify(ast.value);
            return "{value: " + v + ", type:\"" + ast.type + "\"}";
        }
        return "{\n"
            + _.map(ast, function(value, key){
                var k = JSON.stringify(key);
                var v = printAST(value, i + indent_size, indent_size);
                if(key === "value" && ast.type === "RegExp"){
                    v = ast.value;
                }
                return ind(i + indent_size) + k + ": " + v;
            }).join(",\n")
            + "\n" + ind(i) + "}";
    }
    return JSON.stringify(ast);
};

////////////////////////////////////////////////////////////////////////////////
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
console.log("`start` and `end` are character indexes (starting at 0) from the source string.");
console.log();
console.log("The following examples omit the `loc` property for brevity.");
_.each(examples, function(srcs, head){
    console.log();
    console.log(head);
    if(_.isEmpty(srcs)){
        return;
    }
    console.log();
    console.log("```js\n" + _.map(srcs, function(src){
        var ast;
        if(_.isFunction(src)){
            var src_ast = src();
            src = src_ast[0];
            ast = src_ast[1];
        }else{
            ast = parser(src);
        }
        ast = normalizeAST(rmLoc(ast));
        ast = _.isArray(ast) && _.size(ast) === 1 ? _.head(ast) : ast;
        if(ast.type === "ExpressionStatement"){
            ast = ast.expression;
        }
        return src + "\n" + printAST(ast, 0, 2);
    }).join("\n\n") + "\n```");
});
