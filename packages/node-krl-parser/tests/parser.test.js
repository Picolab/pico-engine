var _ = require("lodash");
var test = require("tape");
var rmLoc = require("./rmLoc");
var parser = require("../");
var normalizeAST = require("./normalizeASTForTestCompare");

var parseRuleBody = function(rule_body, expected){
    var src = "";
    src += "ruleset rs {\n";
    src += "  rule r1 {\n";
    src += "    " + rule_body + "\n";
    src += "  }\n";
    src += "}";
    return parser(src).rules[0];
};

var mk = function(v){
    if(_.isNumber(v)){
        return {type: "Number", value: v};
    }else if(v === true || v === false){
        return {type: "Boolean", value: v};
    }else if(_.isString(v)){
        return {type: "String", value: v};
    }else if(_.isRegExp(v)){
        return {type: "RegExp", value: v};
    }else if(_.isPlainObject(v)){
        return {type: "Map", value: _.map(v, function(val, key){
            return {
                type: "MapKeyValuePair",
                key: {type:"String", value: key},
                value: val
            };
        })};
    }else if(_.isArray(v)){
        return {type: "Array", value: _.map(v, mk)};
    }
    return v;
};
mk.id = function(value){
    return {type: "Identifier", value: value};
};
mk.dID = function(domain, value){
    return {type: "DomainIdentifier", value: value, domain: domain};
};
mk.get = function(object, property, method){
    return {
        type: "MemberExpression",
        object: object,
        property: property,
        method: method || "dot"
    };
};
mk.app = function(callee, args, with_){
    return {
        type: "Application",
        callee: callee,
        args: args || [],
        "with": with_ || []
    };
};
mk.key = function(value){
    return {type: "Keyword", value: value};
};
mk.op = function(op, left, right){
    return {
        type: "InfixOperator",
        op: op,
        left: left,
        right: right
    };
};
mk.unary = function(op, arg){
    return {
        type: "UnaryOperator",
        op: op,
        arg: arg
    };
};
mk.ee = function(domain, type, attrs, where, setting, aggregator){
    return {
        type: "EventExpression",
        event_domain: mk.id(domain),
        event_type: mk.id(type),
        event_attrs: attrs || [],
        where: where || null,
        setting: setting ? setting.map(mk.id) : [],
        aggregator: aggregator || null
    };
};
mk.eventOp = function(op, args){
    return {
        type: "EventOperator",
        op: op,
        args: args
    };
};
mk.eventGroupOp = function(op, n, event){
    return {
        type: "EventGroupOperator",
        op: op,
        n: n,
        event: event
    };
};
mk.declare = function(op, left, right){
    return {type: "Declaration", op: op, left: left, right: right};
};
mk.meta = function(key, value){
    return {
        type: "RulesetMetaProperty",
        key: mk.key(key),
        value: value
    };
};
mk.estmt = function(e){
    return {type: "ExpressionStatement", expression: e};
};

test("parser", function(t){
    var assertAST = function(t, src, ast){
        t.deepEquals(parser(src), ast);
    };

    var src = "";
    src += "ruleset rs {\n";
    src += "}";

    assertAST(t, src, {
        type: "Ruleset",
        loc: {start: 0, end: 14},

        rid: {type: "RulesetID", value: "rs", loc: {start: 8, end: 10}},
        meta: void 0,
        global: [],
        rules: []
    });

    src = "";
    src += "ruleset rs {\n";
    src += "  rule r1 {}\n";
    src += "}";

    assertAST(t, src, {
        type: "Ruleset",
        loc: {start: 0, end: 27},

        rid: {type: "RulesetID", value: "rs", loc: {start: 8, end: 10}},
        meta: void 0,
        global: [],
        rules: [
            {
                type: "Rule",
                loc: {start: 15, end: 25},
                name: {type: "Identifier", value: "r1", loc: {start: 20, end: 22}},
                rule_state: "active",
                select: null,
                foreach: [],
                prelude: [],
                action_block: null,
                postlude: null
            }
        ]
    });

    src = "";
    src += "ruleset rs {\n";
    src += "  rule r1 {}\n";
    src += "  rule r2 {}\n";
    src += "}";

    assertAST(t, src, {
        type: "Ruleset",
        loc: {start: 0, end: 40},

        rid: {type: "RulesetID", value: "rs", loc: {start: 8, end: 10}},
        meta: void 0,
        global: [],
        rules: [
            {
                type: "Rule",
                loc: {start: 15, end: 25},
                name: {type: "Identifier", value: "r1", loc: {start: 20, end: 22}},
                rule_state: "active",
                select: null,
                foreach: [],
                prelude: [],
                action_block: null,
                postlude: null
            },
            {
                type: "Rule",
                loc: {start: 28, end: 38},
                name: {type: "Identifier", value: "r2", loc: {start: 33, end: 35}},
                rule_state: "active",
                select: null,
                foreach: [],
                prelude: [],
                action_block: null,
                postlude: null
            }
        ]
    });

    t.end();
});

test("select when", function(t){
    var asertRuleAST = function(rule_body, expected){
        var ast = parseRuleBody(rule_body);
        t.ok(ast.select.kind === "when");
        t.deepEquals(rmLoc(ast.select.event), expected);
    };

    var src = "select when d t";
    asertRuleAST(src, {
        type: "EventExpression",
        event_domain: {type: "Identifier", value: "d"},
        event_type: {type: "Identifier", value: "t"},
        event_attrs: [],
        where: null,
        setting: [],
        aggregator: null
    });

    src = "select when d a or d b";
    asertRuleAST(src, mk.eventOp("or", [
        {
            type: "EventExpression",
            event_domain: {type: "Identifier", value: "d"},
            event_type: {type: "Identifier", value: "a"},
            event_attrs: [],
            where: null,
            setting: [],
            aggregator: null
        },
        {
            type: "EventExpression",
            event_domain: {type: "Identifier", value: "d"},
            event_type: {type: "Identifier", value: "b"},
            event_attrs: [],
            where: null,
            setting: [],
            aggregator: null
        }
    ]));

    src = "select when d a and d b";
    asertRuleAST(src, mk.eventOp("and", [mk.ee("d", "a"), mk.ee("d", "b")]));

    src = "select when d a and (d b or d c)";
    asertRuleAST(src, mk.eventOp("and", [
        mk.ee("d", "a"),
        mk.eventOp("or", [mk.ee("d", "b"), mk.ee("d", "c")])
    ]));

    t.end();
});

test("action", function(t){
    var testAction = function(action_body, expected){
        var src = "ruleset rs{rule r1{select when a b "+action_body+"}}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals(ast.rules[0].action_block, normalizeAST(expected));
    };

    var src ='send_directive("say")';
    testAction(src, {
        type: "RuleActionBlock",
        condition: null,
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: null,
                action: mk.id("send_directive"),
                args: [mk("say")],
                setting: null,
                "with": []
            }
        ]
    });

    src  = 'send_directive("say") with\n';
    src += '  something = "hello world"\n';
    testAction(src, {
        type: "RuleActionBlock",
        condition: null,
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: null,
                action: mk.id("send_directive"),
                args: [mk("say")],
                setting: null,
                "with": [
                    mk.declare("=", mk.id("something"), mk("hello world"))
                ]
            }
        ]
    });


    src  = 'send_directive("say") with\n';
    src += "  one = 1\n";
    src += "  two = 2\n";
    src += "  three = 3\n";
    testAction(src, {
        type: "RuleActionBlock",
        condition: null,
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: null,
                action: mk.id("send_directive"),
                args: [mk("say")],
                setting: null,
                "with": [
                    mk.declare("=", mk.id("one"), mk(1)),
                    mk.declare("=", mk.id("two"), mk(2)),
                    mk.declare("=", mk.id("three"), mk(3))
                ]
            }
        ]
    });

    src  = "if true then blah()";
    testAction(src, {
        type: "RuleActionBlock",
        condition: mk(true),
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: null,
                action: mk.id("blah"),
                args: [],
                setting: null,
                "with": []
            }
        ]
    });

    src  = "lbl=>blah()";
    testAction(src, {
        type: "RuleActionBlock",
        condition: null,
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: mk.id("lbl"),
                action: mk.id("blah"),
                args: [],
                setting: null,
                "with": []
            }
        ]
    });

    src  = "every {";
    src += " one=>blah(1)";
    src += " two => blah(2)";
    src += " noop()";
    src += "}";
    testAction(src, {
        type: "RuleActionBlock",
        condition: null,
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: mk.id("one"),
                action: mk.id("blah"),
                args: [mk(1)],
                setting: null,
                "with": []
            },
            {
                type: "RuleAction",
                label: mk.id("two"),
                action: mk.id("blah"),
                args: [mk(2)],
                setting: null,
                "with": []
            },
            {
                type: "RuleAction",
                label: null,
                action: mk.id("noop"),
                args: [],
                setting: null,
                "with": []
            }
        ]
    });

    src  = "choose exp() {\n";
    src += "  one => blah(1)\n";
    src += "  two => blah(2)\n";
    src += "}";
    testAction(src, {
        type: "RuleActionBlock",
        condition: mk.app(mk.id("exp")),
        block_type: "choose",
        actions: [
            {
                type: "RuleAction",
                label: mk.id("one"),
                action: mk.id("blah"),
                args: [mk(1)],
                setting: null,
                "with": []
            },
            {
                type: "RuleAction",
                label: mk.id("two"),
                action: mk.id("blah"),
                args: [mk(2)],
                setting: null,
                "with": []
            }
        ]
    });

    src  = "if foo == 2 then every {\n";
    src += "  one => blah(1)\n";
    src += "  two => blah(2)\n";
    src += "}";
    testAction(src, {
        type: "RuleActionBlock",
        condition: mk.op("==", mk.id("foo"), mk(2)),
        block_type: "every",
        actions: [
            {
                type: "RuleAction",
                label: mk.id("one"),
                action: mk.id("blah"),
                args: [mk(1)],
                setting: null,
                "with": []
            },
            {
                type: "RuleAction",
                label: mk.id("two"),
                action: mk.id("blah"),
                args: [mk(2)],
                setting: null,
                "with": []
            }
        ]
    });

    t.end();
});

test("locations", function(t){
    var src = "";
    src += "ruleset one {\n";
    src += "  rule two {\n";
    src += "  }\n";
    src += "}\n";

    t.deepEquals(parser(src), {
        type: "Ruleset",
        loc: {start: 0, end: 32},
        rid: {
            loc: {start: 8, end: 11},
            type: "RulesetID",
            value: "one"
        },
        meta: void 0,
        global: [],
        rules: [
            {
                loc: {start: 16, end: 30},
                type: "Rule",
                name: {
                    loc: {start: 21, end: 24},
                    type: "Identifier",
                    value: "two"
                },
                rule_state: "active",
                select: null,
                foreach: [],
                prelude: [],
                action_block: null,
                postlude: null
            }
        ]
    });

    src = "select when a b";
    t.deepEquals(parser("ruleset one {rule two {" + src + "}}").rules[0].select.event, {
        loc: {start: 35, end: 38},
        type: "EventExpression",
        event_domain: {
            loc: {start: 35, end: 36},
            type: "Identifier",
            value: "a"
        },
        event_type: {
            loc: {start: 37, end: 38},
            type: "Identifier",
            value: "b"
        },
        event_attrs: [],
        where: null,
        setting: [],
        aggregator: null
    });

    src = "select when a b or c d";
    t.deepEquals(parser("ruleset one {rule two {" + src + "}}").rules[0].select.event, {
        loc: {start: 35, end: 45},
        type: "EventOperator",
        op: "or",
        args: [
            {
                loc: {start: 35, end: 38},
                type: "EventExpression",
                event_domain: {
                    loc: {start: 35, end: 36},
                    type: "Identifier",
                    value: "a"
                },
                event_type: {
                    loc: {start: 37, end: 38},
                    type: "Identifier",
                    value: "b"
                },
                event_attrs: [],
                where: null,
                setting: [],
                aggregator: null
            },
            {
                loc: {start: 42, end: 45},
                type: "EventExpression",
                event_domain: {
                    loc: {start: 42, end: 43},
                    type: "Identifier",
                    value: "c"
                },
                event_type: {
                    loc: {start: 44, end: 45},
                    type: "Identifier",
                    value: "d"
                },
                event_attrs: [],
                where: null,
                setting: [],
                aggregator: null
            }
        ]
    });
    src = 'select when a b\nsend_directive("say")';
    t.deepEquals(parser("ruleset one {rule two {" + src + "}}").rules[0].action_block.actions[0], {
        loc: {start: 39, end: 60},
        type: "RuleAction",
        label: null,
        action: {
            loc: {start: 39, end: 53},
            type: "Identifier",
            value: "send_directive"
        },
        args: [
            {
                loc: {start: 54, end: 59},
                type: "String",
                value: "say"
            }
        ],
        setting: null,
        "with": []
    });
    src = 'select when a b\nsend_directive("say") with\nblah = 1';
    t.deepEquals(parser("ruleset one {rule two {" + src + "}}").rules[0].action_block.actions[0], {
        loc: {start: 39, end: 74},
        type: "RuleAction",
        label: null,
        action: {
            loc: {start: 39, end: 53},
            type: "Identifier",
            value: "send_directive"
        },
        args: [
            {
                loc: {start: 54, end: 59},
                type: "String",
                value: "say"
            }
        ],
        setting: null,
        "with": [
            {
                loc: {start: 66, end: 74},
                type: "Declaration",
                op: "=",
                left: {
                    loc: {start: 66, end: 70},
                    type: "Identifier",
                    value: "blah",
                },
                right: {
                    loc: {start: 73, end: 74},
                    type: "Number",
                    value: 1
                }
            }
        ]
    });

    t.deepEquals(parser("ruleset a{meta{shares b}}").meta.properties[0].key.loc, {start: 15, end: 21});
    t.deepEquals(parser("ruleset a{meta{share b}}").meta.properties[0].key.loc, {start: 15, end: 20});
    t.deepEquals(parser("ruleset a{meta{share b}}").meta.properties[0].loc, {start: 15, end: 22});
    t.deepEquals(parser('ruleset a{meta{name "b"}}').meta.properties[0].loc, {start: 15, end: 23});

    var testTopLoc = function(src){
        var src2 = "\n  " + src + "  \n ";
        var ast = parser(src2);
        t.equals(
            src2.substring(ast[0].loc.start, ast[0].loc.end),
            src,
            "if loc is correct, it will match the original input"
        );
    };

    testTopLoc("name");
    testTopLoc('"some string"');
    testTopLoc("-1.2");
    testTopLoc("a => b | c");
    testTopLoc("function(a){b}");
    testTopLoc("a [ 1  ]");
    testTopLoc('a {[ "a", "b"] }');

    t.end();
});

test("literals", function(t){
    var testLiteral = function(src, expected){
        var ast = parser(src);
        ast = ast[0].expression;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };
    testLiteral('"one"', {type: "String", value: "one"});
    testLiteral('"one\ntwo"', {type: "String", value: "one\ntwo"});
    testLiteral('"one\\"two"', {type: "String", value: 'one"two'});

    testLiteral("123", {type: "Number", value: 123});
    testLiteral("-1", mk.unary("-", {type: "Number", value: 1}));
    testLiteral("1.5", {type: "Number", value: 1.5});
    testLiteral("+1.5", mk.unary("+", {type: "Number", value: 1.5}));
    testLiteral("-.50", mk.unary("-", {type: "Number", value: 0.5}));
    testLiteral("-0.0", mk.unary("-", {type: "Number", value: 0}));

    testLiteral("true", {type: "Boolean", value: true});
    testLiteral("false", {type: "Boolean", value: false});

    testLiteral("[]", {type: "Array", value: []});
    testLiteral('["one"]', {type: "Array", value: [{type: "String", value: "one"}]});
    testLiteral("[  1,  false ]", {type: "Array", value: [
        {type: "Number", value: 1},
        {type: "Boolean", value: false}
    ]});

    testLiteral("{}", {type: "Map", value: []});
    testLiteral('{ "one" : "two" }', {type: "Map", value: [
        {
            type: "MapKeyValuePair",
            key: {type:"String",value:"one"},
            value: {type:"String",value:"two"}
        }
    ]});
    testLiteral('{"1":2,"3":true,"5":[]}', {type: "Map", value: [
        {
            type: "MapKeyValuePair",
            key: {type:"String",value:"1"},
            value: {type:"Number",value:2}
        },
        {
            type: "MapKeyValuePair",
            key: {type:"String",value:"3"},
            value: {type:"Boolean",value:true}
        },
        {
            type: "MapKeyValuePair",
            key: {type:"String",value:"5"},
            value: {type:"Array",value:[]}
        }
    ]});

    testLiteral("re#one#", {type: "RegExp", value: /one/});
    testLiteral("re#one#i", {type: "RegExp", value: /one/i});
    testLiteral("re#one#ig", {type: "RegExp", value: /one/ig});
    testLiteral("re#^one(/two)? .* $#ig", {type: "RegExp", value: /^one(\/two)? .* $/ig});
    testLiteral("re#\\# else\\\\#ig", {type: "RegExp", value: /# else\\/ig});
    testLiteral("re#/ok/g#ig", {type: "RegExp", value: /\/ok\/g/ig});

    testLiteral("<<>>", {
        type: "Chevron",
        value: [
        ]
    });
    testLiteral("<<\n  hello\n  >>", {
        type: "Chevron",
        value: [
            {type: "String", value: "\n  hello\n  "}
        ]
    });
    testLiteral("<<#{1}>>", {
        type: "Chevron",
        value: [
            {type: "Number", value: 1},
        ]
    });

    testLiteral("<<one#{2}three>>", {
        type: "Chevron",
        value: [
            {type: "String", value: "one"},
            {type: "Number", value: 2},
            {type: "String", value: "three"}
        ]
    });

    testLiteral('<<one#{{"one":2}}three>>', {
        type: "Chevron",
        value: [
            {type: "String", value: "one"},
            {type: "Map", value: [
                {
                    type: "MapKeyValuePair",
                    key: {type:"String",value:"one"},
                    value: {type:"Number",value:2}
                }
            ]},
            {type: "String", value: "three"}
        ]
    });

    testLiteral('<< This #{ x{"flip"} } that >>', {
        type: "Chevron",
        value: [
            {type: "String", value: " This "},
            {
                type: "MemberExpression",
                object: mk.id("x"),
                property: mk("flip"),
                method: "path"
            },
            {type: "String", value: " that "}
        ]
    });

    testLiteral("<< double <<with>\\>in >>", {
        type: "Chevron",
        value: [
            {type: "String", value: " double <<with>>in "},
        ]
    });

    testLiteral("<<one#{<<two#{three}>>}>>", {
        type: "Chevron",
        value: [
            {type: "String", value: "one"},
            {type: "Chevron", value: [
                {type: "String", value: "two"},
                {type: "Identifier", value: "three"},
            ]},
        ]
    });

    testLiteral("<<one#{{\"two\":function(){<<#{three{four}}five>>}}}>>", {
        type: "Chevron",
        value: [
            {type: "String", value: "one"},
            mk({two: {
                type: "Function",
                params: [],
                body: [
                    {
                        type: "ExpressionStatement",
                        expression: {
                            type: "Chevron",
                            value: [
                                mk.get(mk.id("three"), mk.id("four"), "path"),
                                {type: "String", value: "five"},
                            ],
                        }
                    }
                ],
            }}),
        ]
    });

    t.end();
});

test("operator precedence", function(t){
    var testPrec = function(src, expected){
        var ast = normalizeAST(rmLoc(parser(src)));
        ast = ast[0].expression;
        var s = function(ast){
            if(_.isArray(ast)){
                return _.map(ast, s).join(" ");
            }else if(ast.type === "InfixOperator"){
                return "(" + ast.op + " " + s(ast.left) + " " + s(ast.right) + ")";
            }
            return ast.value;
        };
        t.equals(s(ast), expected);
    };

    testPrec("a + b", "(+ a b)");
    testPrec("a+b+c", "(+ (+ a b) c)");
    testPrec("a+b*c", "(+ a (* b c))");

    testPrec("a || b && c", "(|| a (&& b c))");
    testPrec("(a || b) && c", "(&& (|| a b) c)");

    testPrec("a && b cmp c", "(&& a (cmp b c))");

    testPrec("a * b < c && d", "(&& (< (* a b) c) d)");

    t.end();
});

test("expressions", function(t){
    var testExp = function(src, expected){
        var ast = parser(src);
        ast = ast[0];
        if(ast.type === "ExpressionStatement"){
            ast = ast.expression;
        }
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };

    testExp("one()", {
        type: "Application",
        callee: {type: "Identifier", value: "one"},
        args: [],
        "with": []
    });
    testExp("one ( 1 , 2 )", mk.app(mk.id("one"), [mk(1), mk(2)]));
    testExp("one (1,2)", mk.app(mk.id("one"), [mk(1), mk(2)]));
    testExp("one(1, 2) with a = 3 b = 4", mk.app(mk.id("one"), [mk(1), mk(2)], [
        mk.declare("=", mk.id("a"), mk(3)),
        mk.declare("=", mk.id("b"), mk(4))
    ]));

    testExp('1 + "two"', {
        type: "InfixOperator",
        op: "+",
        left: {type: "Number", value: 1},
        right: {type: "String", value: "two"}
    });

    testExp("1 like re#one#i", {
        type: "InfixOperator",
        op: "like",
        left: {type: "Number", value: 1},
        right: {type: "RegExp", value: /one/i}
    });

    testExp("a => b | c", {
        type: "ConditionalExpression",
        test:       {type: "Identifier", value: "a"},
        consequent: {type: "Identifier", value: "b"},
        alternate:  {type: "Identifier", value: "c"}
    });

    testExp("a => b | c => d | e", {
        type: "ConditionalExpression",
        test:       {type: "Identifier", value: "a"},
        consequent: {type: "Identifier", value: "b"},
        alternate:  {
            type: "ConditionalExpression",
            test:       {type: "Identifier", value: "c"},
            consequent: {type: "Identifier", value: "d"},
            alternate:  {type: "Identifier", value: "e"}
        }
    });

    testExp("a=>b|c=>d|e", {
        type: "ConditionalExpression",
        test:       {type: "Identifier", value: "a"},
        consequent: {type: "Identifier", value: "b"},
        alternate:  {
            type: "ConditionalExpression",
            test:       {type: "Identifier", value: "c"},
            consequent: {type: "Identifier", value: "d"},
            alternate:  {type: "Identifier", value: "e"}
        }
    });

    testExp("function (){}", {
        type: "Function",
        params: [],
        body: []
    });
    testExp("function(a){b}", {
        type: "Function",
        params: [mk.id("a")],
        body: [
            {
                type: "ExpressionStatement",
                expression: mk.id("b")
            }
        ]
    });

    testExp('a = "one"', {
        type: "Declaration",
        op: "=",
        left: mk.id("a"),
        right: mk("one")
    });

    testExp("a[1]", {
        type: "MemberExpression",
        object: mk.id("a"),
        property: mk(1),
        method: "index"
    });

    testExp("matrix[i][j]", {
        type: "MemberExpression",
        object: {
            type: "MemberExpression",
            object: mk.id("matrix"),
            property: mk.id("i"),
            method: "index"
        },
        property: mk.id("j"),
        method: "index"
    });

    testExp('foo{"bar"}', {
        type: "MemberExpression",
        object: mk.id("foo"),
        property: mk("bar"),
        method: "path"
    });

    testExp('foo{"bar"}()', mk.app({
        type: "MemberExpression",
        object: mk.id("foo"),
        property: mk("bar"),
        method: "path"
    }));

    testExp("one.two", {
        type: "MemberExpression",
        object: mk.id("one"),
        property: mk.id("two"),
        method: "dot"
    });

    testExp("one.two()", mk.app({
        type: "MemberExpression",
        object: mk.id("one"),
        property: mk.id("two"),
        method: "dot"
    }));

    testExp("one().two", {
        type: "MemberExpression",
        object: mk.app(mk.id("one")),
        property: mk.id("two"),
        method: "dot"
    });

    testExp("one().two()", mk.app({
        type: "MemberExpression",
        object: mk.app(mk.id("one")),
        property: mk.id("two"),
        method: "dot"
    }));

    testExp("1.isnull()", mk.app({
        type: "MemberExpression",
        object: mk(1),
        property: mk.id("isnull"),
        method: "dot"
    }));

    testExp("not a", mk.unary("not", mk.id("a")));
    testExp("nota", mk.id("nota"));
    testExp("not not a || b",
        mk.op("||",
            mk.unary("not",  mk.unary("not", mk.id("a"))),
            mk.id("b")
        )
    );
    testExp("not (not a || b)",
        mk.unary("not", mk.op("||", mk.unary("not", mk.id("a")), mk.id("b")))
    );

    try{
        testExp("function(a){b = 1;a = 1}", {});
        t.fail("functions must end with an expression");
    }catch(e){
        t.ok(true, "should not parse b/c functions must end with an expression");
    }
    testExp("function(a){b = 1;a(b);}", {
        type: "Function",
        params: [mk.id("a")],
        body: [
            mk.declare("=", mk.id("b"), mk(1)),
            mk.estmt(mk.app(mk.id("a"), [mk.id("b")])),
        ]
    });

    t.end();
});

test("EventExpression", function(t){
    var testEE = function(rule_body, expected){
        if(/\)\s*$/.test(rule_body)){
            rule_body += ";";//TODO can remove this?
        }
        var ast = normalizeAST(rmLoc(parseRuleBody("select when " + rule_body)));
        t.deepEquals(ast.select.event, normalizeAST(expected));
    };

    testEE("a b", {
        type: "EventExpression",
        event_domain: mk.id("a"),
        event_type: mk.id("b"),
        event_attrs: [],
        where: null,
        setting: [],
        aggregator: null
    });

    testEE("a b where c", {
        type: "EventExpression",
        event_domain: mk.id("a"),
        event_type: mk.id("b"),
        event_attrs: [],
        where: mk.id("c"),
        setting: [],
        aggregator: null
    });

    testEE("a b where 1 / (c - 2)", {
        type: "EventExpression",
        event_domain: mk.id("a"),
        event_type: mk.id("b"),
        event_attrs: [],
        where: mk.op("/", mk(1), mk.op("-", mk.id("c"), mk(2))),
        setting: [],
        aggregator: null
    });

    testEE("a b amt re#[0-9]{4}#", {
        type: "EventExpression",
        event_domain: mk.id("a"),
        event_type: mk.id("b"),
        event_attrs: [
            {
                type: "AttributeMatch",
                key: mk.id("amt"),
                value: mk(/[0-9]{4}/)
            }
        ],
        where: null,
        setting: [],
        aggregator: null
    });

    testEE("a b amt re#([0-9]+)# setting(amt_n)", {
        type: "EventExpression",
        event_domain: mk.id("a"),
        event_type: mk.id("b"),
        event_attrs: [
            {
                type: "AttributeMatch",
                key: mk.id("amt"),
                value: mk(/[0-9]{4}/)
            }
        ],
        where: null,
        setting: [mk.id("amt_n")],
        aggregator: null
    });

    testEE("a b c re#(.*)# d re#(.*)# setting(e,f)", {
        type: "EventExpression",
        event_domain: mk.id("a"),
        event_type: mk.id("b"),
        event_attrs: [
            {
                type: "AttributeMatch",
                key: mk.id("c"),
                value: mk(/(.*)/)
            },
            {
                type: "AttributeMatch",
                key: mk.id("d"),
                value: mk(/(.*)/)
            }
        ],
        where: null,
        setting: [mk.id("e"), mk.id("f")],
        aggregator: null
    });

    testEE("a b setting(c) or d e setting(f) before g h", mk.eventOp("or", [
        mk.ee("a", "b", [], null, ["c"]),
        mk.eventOp("before", [
            mk.ee("d", "e", [], null, ["f"]),
            mk.ee("g", "h")
        ])
    ]));

    testEE("a b between(c d, e f)", mk.eventOp("between", [
        mk.ee("a", "b"),
        mk.ee("c", "d"),
        mk.ee("e", "f")
    ]));

    testEE("a b not\n  between ( c d,e f )", mk.eventOp("not between", [
        mk.ee("a", "b"),
        mk.ee("c", "d"),
        mk.ee("e", "f")
    ]));

    testEE("any 2 (a b, c d, e f)", mk.eventOp("any", [
        mk(2),
        mk.ee("a", "b"),
        mk.ee("c", "d"),
        mk.ee("e", "f")
    ]));

    testEE("count 2 (a b)", mk.eventGroupOp("count", mk(2), mk.ee("a", "b")));

    testEE("repeat 2(a b)", mk.eventGroupOp("repeat", mk(2), mk.ee("a", "b")));

    testEE("and(a b, c d, e f)", mk.eventOp("and", [
        mk.ee("a", "b"),
        mk.ee("c", "d"),
        mk.ee("e", "f")
    ]));

    testEE("a b or and(c d, e f)", mk.eventOp("or", [
        mk.ee("a", "b"),
        mk.eventOp("and", [
            mk.ee("c", "d"),
            mk.ee("e", "f")
        ])
    ]));

    testEE("count 5 (a b) max(d)", mk.eventGroupOp(
                "count",
                mk(5),
                mk.ee("a", "b", [], null, [], {
                    type: "EventAggregator",
                    op: "max",
                    args: [mk.id("d")]
                })
    ));

    _.each(["min", "max", "sum", "avg", "push"], function(op){
        testEE("repeat 5 (a b) " + op + "(c)", mk.eventGroupOp(
                    "repeat",
                    mk(5),
                    mk.ee("a", "b", [], null, [], {
                        type: "EventAggregator",
                        op: op,
                        args: [mk.id("c")]
                    })
        ));
    });

    testEE("before (a b, c d)", mk.eventOp("before", [
        mk.ee("a", "b"),
        mk.ee("c", "d")
    ]));
    testEE("then (a b, c d)", mk.eventOp("then", [
        mk.ee("a", "b"),
        mk.ee("c", "d")
    ]));
    testEE("after (a b, c d)", mk.eventOp("after", [
        mk.ee("a", "b"),
        mk.ee("c", "d")
    ]));

    var testWithin = function(rule_body, expected){
        var ast = normalizeAST(rmLoc(parseRuleBody("select when " + rule_body)));
        t.deepEquals(ast.select, normalizeAST(expected));
    };

    testWithin("a a before b b within 5 minutes", {
        type: "RuleSelect",
        kind: "when",
        event: mk.eventOp("before", [mk.ee("a", "a"), mk.ee("b", "b")]),
        within: {
            type: "EventWithin",
            expression: mk(5),
            time_period: "minutes"
        }
    });
    testWithin("a a before b b within 1 + 3 minutes", {
        type: "RuleSelect",
        kind: "when",
        event: mk.eventOp("before", [mk.ee("a", "a"), mk.ee("b", "b")]),
        within: {
            type: "EventWithin",
            expression: mk.op("+", mk(1), mk(3)),
            time_period: "minutes"
        }
    });
    testWithin("a a or (b b and c c) within 1 hour", {
        type: "RuleSelect",
        kind: "when",
        event: mk.eventOp("or", [mk.ee("a", "a"), mk.eventOp("and", [mk.ee("b", "b"), mk.ee("c", "c")])]),
        within: {
            type: "EventWithin",
            expression: mk(1),
            time_period: "hour"
        }
    });

    t.end();
});

test("RulesetID", function(t){
    var testName = function(name, is_valid){
        try{
            parser("ruleset " + name + " {}");
            t.ok(is_valid);
        }catch(e){
            t.ok(!is_valid);
        }
    };
    testName("io.picolabs.some-thing", true);
    testName("A.B-b9.c", true);

    testName("1.2.3", false);
    testName(".wat", false);
    testName("io. picolabs", false);// no spaces
    testName("some - thing", false);// no spaces
    t.end();
});

test("Ruleset meta", function(t){
    var testMeta = function(meta_body, expected){
        var src = "ruleset rs{meta{" + meta_body + "}}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals(ast.meta, {
            type: "RulesetMeta",
            properties: normalizeAST(expected)
        });
    };

    testMeta("", []);
    testMeta("   ", []);//testing for whitespace parsing ambiguity

    testMeta('name "two"', [
        {
            type: "RulesetMetaProperty",
            key: mk.key("name"),
            value: mk("two")
        }
    ]);

    //testing for whitespace parsing ambiguity
    testMeta('\n  name "two"\n  ', [
        mk.meta("name", mk("two"))
    ]);

    testMeta('name "blah" description <<\n  wat? ok\n  >>\nauthor "bob"', [
        mk.meta("name", mk("blah")),
        mk.meta("description", {
            type: "Chevron",
            value: [
                {type: "String", value: "\n  wat? ok\n  "}
            ]
        }),
        mk.meta("author", mk("bob"))
    ]);

    testMeta('keys one "one string"\n keys two {"some": "map"}', [
        mk.meta("keys", [mk.key("one"), mk("one string")]),
        mk.meta("keys", [mk.key("two"), mk({"some": mk("map")})])
    ]);
    //"key" is the same as "keys"
    testMeta('key one "one string"\n key two {"some": "map"}', [
        mk.meta("keys", [mk.key("one"), mk("one string")]),
        mk.meta("keys", [mk.key("two"), mk({"some": mk("map")})])
    ]);

    testMeta("logging on", [mk.meta("logging", mk(true))]);
    testMeta("logging off", [mk.meta("logging", mk(false))]);

    testMeta([
        "use module com.blah",
        'use module com.blah version "2" alias blah with one = 2 three = 4'
    ].join("\n"), [
        mk.meta("use", {
            kind: "module",
            rid: {type: "RulesetID", value: "com.blah"},
            version: null,
            alias:   null,
            "with":  null
        }),
        mk.meta("use", {
            kind: "module",
            rid: {type: "RulesetID", value: "com.blah"},
            version: mk("2"),
            alias: mk.id("blah"),
            "with": [
                mk.declare("=", mk.id("one"), mk(2)),
                mk.declare("=", mk.id("three"), mk(4))
            ]
        })
    ]);

    testMeta([
        "errors to com.blah",
        'errors to com.blah version "2"'
    ].join("\n"), [
        mk.meta("errors", {
            rid: {type: "RulesetID", value: "com.blah"},
            version: null
        }),
        mk.meta("errors", {
            rid: {type: "RulesetID", value: "com.blah"},
            version: mk("2")
        })
    ]);

    testMeta([
        "provide x, y, z",
        "provides x, y, z",
        "provides keys s3, gmail to com.google, io.picolabs"
    ].join("\n"), [
        mk.meta("provides", {
            ids: [mk.id("x"), mk.id("y"), mk.id("z")]
        }),
        mk.meta("provides", {
            ids: [mk.id("x"), mk.id("y"), mk.id("z")]
        }),
        mk.meta("provides", {
            operator: mk.key("keys"),
            ids: [mk.id("s3"), mk.id("gmail")],
            rulesets: [
                {type: "RulesetID", value: "com.google"},
                {type: "RulesetID", value: "io.picolabs"}
            ]
        })
    ]);

    testMeta([
        "share x, y, z",
        "shares x, y, z"
    ].join("\n"), [
        mk.meta("shares", {
            ids: [mk.id("x"), mk.id("y"), mk.id("z")]
        }),
        mk.meta("shares", {
            ids: [mk.id("x"), mk.id("y"), mk.id("z")]
        })
    ]);

    testMeta("configure using a = 1", [{
        type: "RulesetMetaProperty",
        key: mk.key("configure"),
        value: {
            declarations: [
                mk.declare("=", mk.id("a"), mk(1))
            ]
        }
    }]);
    testMeta("configure using a = 1 b = 2", [{
        type: "RulesetMetaProperty",
        key: mk.key("configure"),
        value: {
            declarations: [
                mk.declare("=", mk.id("a"), mk(1)),
                mk.declare("=", mk.id("b"), mk(2))
            ]
        }
    }]);

    t.end();
});

test("Rule prelude", function(t){
    var testPre = function(pre_body, expected){
        var src = "ruleset rs{rule r1{pre{" + pre_body + "}}}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals(ast.rules[0].prelude, normalizeAST(expected));
    };

    testPre("a = 1 b = 2", [
        {
            type: "Declaration",
            op: "=",
            left: mk.id("a"),
            right: mk(1)
        },
        {
            type: "Declaration",
            op: "=",
            left: mk.id("b"),
            right: mk(2)
        }
    ]);

    t.end();
});

test("Rule state", function(t){
    var testRuleState = function(rule, expected){
        var src = "ruleset rs{" + rule + "}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals(ast.rules[0].rule_state, normalizeAST(expected));
    };

    testRuleState("rule r1{}", "active");
    testRuleState("rule r1 is active{}", "active");
    testRuleState("rule r1 is inactive{}", "inactive");
    testRuleState("rule r1   is    inactive   {}", "inactive");

    t.end();
});

test("RulePostlude", function(t){
    var testPost = function(postlude, expected){
        var src = "ruleset rs{rule r1{" + postlude + "}}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals(ast.rules[0].postlude, normalizeAST(expected));
    };

    //test location
    var src = "ruleset rs{rule r1{always{one();two()}}}";
    t.deepEquals(parser(src).rules[0].postlude, {
        loc: {start: 19, end: 38},
        type: "RulePostlude",
        fired: null,
        notfired: null,
        always: [
            {
                loc: {start: 26, end: 31},
                type: "ExpressionStatement",
                expression: {
                    loc: {start: 26, end: 31},
                    type: "Application",
                    callee: {
                        loc: {start: 26, end: 29},
                        type: "Identifier",
                        value: "one"
                    },
                    args: [],
                    "with": []
                }
            },
            {
                loc: {start: 32, end: 37},
                type: "ExpressionStatement",
                expression: {
                    loc: {start: 32, end: 37},
                    type: "Application",
                    callee: {
                        loc: {start: 32, end: 35},
                        type: "Identifier",
                        value: "two"
                    },
                    args: [],
                    "with": []
                }
            }
        ]
    });

    testPost("fired{}", {
        type: "RulePostlude",
        fired: [],
        notfired: null,
        always: null
    });

    testPost("fired{}else{}", {
        type: "RulePostlude",
        fired: [],
        notfired: [],
        always: null
    });

    testPost("fired{}else{}finally{}", {
        type: "RulePostlude",
        fired: [],
        notfired: [],
        always: []
    });

    testPost("fired{}finally{}", {
        type: "RulePostlude",
        fired: [],
        notfired: null,
        always: []
    });

    testPost("notfired{}", {
        type: "RulePostlude",
        fired: null,
        notfired: [],
        always: null
    });

    testPost("notfired{}else{}", {
        type: "RulePostlude",
        fired: [],
        notfired: [],
        always: null
    });

    testPost("notfired{}else{}finally{}", {
        type: "RulePostlude",
        fired: [],
        notfired: [],
        always: []
    });

    testPost("notfired{}finally{}", {
        type: "RulePostlude",
        fired: null,
        notfired: [],
        always: []
    });

    t.end();
});

test("ruleset global declarations", function(t){
    var testGlobal = function(global_body, expected){
        var src = [
            "ruleset rs {",
            "  global {",
            "    " + global_body,
            "  }",
            "}"
        ].join("\n");
        var ast = rmLoc(parser(src));
        t.deepEquals(ast.global, expected);
    };

    testGlobal("", []);

    testGlobal("a = 1", [
        mk.declare("=", mk.id("a"), mk(1))
    ]);

    testGlobal("a = 1 b = 2", [
        mk.declare("=", mk.id("a"), mk(1)),
        mk.declare("=", mk.id("b"), mk(2))
    ]);

    t.end();
});

test("comments preserve locations", function(t){
    var ast = parser("1; //some comment\n2/*annother comment*/;3");
    t.deepEquals(ast, _.map([
        _.assign(mk(1), {loc: {start: 0, end: 1}}),
        _.assign(mk(2), {loc: {start: 18, end: 19}}),
        _.assign(mk(3), {loc: {start: 40, end: 41}})
    ], function(e){
        return {loc: e.loc, type: "ExpressionStatement", expression: e};
    }));
    t.end();
});

test("parse errors", function(t){
    var src = "";
    src += "//test parse error reporting\n";
    src += "ruleset rs {\n";
    src += "  rule r0 {\n";
    src += "    select blah\n";
    src += "  }\n";
    src += "}";
    try{
        parser(src, {filename: "select-blah.krl"});
        t.fail();
    }catch(e){
        var emsg = "";
        emsg += "No possible parsings\n";
        emsg += "select-blah.krl:4:12\n";
        emsg += " \n";//the space is a hack b/c errors usually collapse blank lines
        emsg += "    select blah\n";
        emsg += "           ^";
        t.equals(e.message, emsg);
    }
    src = "";
    src += "ruleset rs {\n";
    src += "  rule r0 {\n";
    src += "    select when a b setting(c)\n";
    src += "  }\n";
    src += "}";
    parser(src, {filename: "ruleset-ambiguity.krl"});
    t.ok("should not throw up");
    t.end();
});

test("no ambiguity!", function(t){
    //run $ node tests/ambiguityFinder.js to help you find them
    var testAmb = function(src, should_be_no_parsing){
        try{
            parser(src);
            if(should_be_no_parsing){
                t.fail("should_be_no_parsing");
                return;
            }
            t.ok(true);
        }catch(e){
            if(should_be_no_parsing && /No possible parsings/i.test(e + "")){
                //this is ok b/c it is not ambiguous
                t.ok(true);
            }else{
                throw e;
            }
        }
    };

    testAmb("one_eq_two");
    testAmb("somelikethis");

    //map_always{} -or- map_ always { getPath();
    testAmb("ruleset a{rule b{select when a b;c() with d = map_always{getPath()}}}");

    testAmb("ruleset a{rule b{select when Domain TypeAttrib re#(.*)#}}", true);

    //a >< "blah" -or- a > "<blah"
    testAmb("a><<<blah>>");
    //"blah" >< a -or- "blah>" < a
    testAmb("<<blah>>><a");
    testAmb("<<blah>><a");//"blah"<a

    //in this case where should be an attribute
    testAmb("ruleset a{rule b{select when a b where re#(.*)#}}");

    //whitespace ambiguity in expresion lists
    testAmb("[  ]");
    testAmb("hello(    )");
    testAmb("ruleset a{rule b{select when a b;noop(     )}}");

    //whitespace ambiguity in function params
    testAmb("function(   ){}");
    testAmb("ruleset a{rule b{select when c d setting(  e  );}}");
    testAmb("ruleset a{rule b{select when repeat 5 (c d) max(  e  );}}");
    testAmb("ruleset a{rule b{select when repeat 5 (c d) push(  e  );}}");

    //whitespace ambiguity in statement list
    testAmb("function(){   }");
    testAmb("  one  (  ) ;  two  (  )  ");

    //whitespace ambiguity in Map
    testAmb("{   }");
    testAmb('{ "one"  :   2  , "  three  "   : 4  }');

    //ambiguity on the provides operator
    testAmb("ruleset rs{meta { provides notanop errors to i}}");

    //log info (-1) or log(info-1) i.e. log default level
    testAmb("ruleset a{rule b{always{log info - 1}}}");

    t.end();
});

test("DomainIdentifier", function(t){

    t.deepEquals(parser("ent:name")[0].expression, {
        loc: {start: 0, end: 8},
        type: "DomainIdentifier",
        value: "name",
        domain: "ent"
    });

    var testIt = function(src, expected){
        var ast = parser(src)[0];
        if(ast.type === "ExpressionStatement"){
            ast = ast.expression;
        }
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };
    testIt("name", mk.id("name"));
    testIt("app:name", mk.dID("app", "name"));
    testIt("ent:name", mk.dID("ent", "name"));
    testIt(
        'event:attr("name").klog("hi")',
        mk.app(
            mk.get(
                mk.app(mk.dID("event", "attr"), [mk("name")]),
                mk.id("klog")
            ),
            [mk("hi")]
        )
    );

    testIt("ent:name.blah", mk.get(mk.dID("ent", "name"), mk.id("blah")));
    try{
        parser("blah.ent:name");
        t.fail();
    }catch(e){
        t.ok(/No possible parsings/i.test(e + ""));
    }

    testIt('ent:name = "bob"', mk.declare("=", mk.dID("ent", "name"), mk("bob")));
    testIt('ent:names[0] = "jim"', mk.declare("=", mk.get(mk.dID("ent", "names"), mk(0), "index"), mk("jim")));
    testIt('ent:users{["id2", "name", "first"]} = "sue"', mk.declare(
        "=",
        mk.get(mk.dID("ent", "users"), mk(["id2", "name", "first"]), "path"),
        mk("sue")
    ));

    t.end();
});

test("PersistentVariableAssignment", function(t){

    var testPostlude = function(src_core, expected){
        var src = "ruleset rs{rule a{ fired{" + src_core + "}}}";
        var ast = parser(src).rules[0].postlude.fired;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };
    try{
        parser("ent:blah := 1");
        t.fail();
    }catch(e){
        t.ok(true, "Assignment should only be allowed in the postlude");
    }

    testPostlude("ent:name := 1", [
        {
            type: "PersistentVariableAssignment",
            op: ":=",
            left: mk.dID("ent", "name"),
            path_expression: null,
            right: mk(1)
        }
    ]);

    testPostlude("ent:user{[\"firstname\"]} := \"bob\"", [
        {
            type: "PersistentVariableAssignment",
            op: ":=",
            left: mk.dID("ent", "user"),
            path_expression: mk(["firstname"]),
            right: mk("bob")
        }
    ]);

    t.end();
});

test("raise event", function(t){

    var testPostlude = function(src_core, expected){
        var src = "ruleset rs{rule a{ fired{" + src_core + "}}}";
        var ast = parser(src).rules[0].postlude.fired;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };

    testPostlude("raise domain event \"type\"", [
        {
            type: "RaiseEventStatement",
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            for_rid: null,
            event_attrs: null
        }
    ]);

    testPostlude("raise domain event \"type\" for \"io.picolabs.test\"", [
        {
            type: "RaiseEventStatement",
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            for_rid: mk("io.picolabs.test"),
            event_attrs: null
        }
    ]);

    testPostlude("raise domain event \"type\" with a = 1 b = 2", [
        {
            type: "RaiseEventStatement",
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            for_rid: null,
            event_attrs: {
                type: "RaiseEventAttributes",
                "with": [
                    mk.declare("=", mk.id("a"), mk(1)),
                    mk.declare("=", mk.id("b"), mk(2))
                ]
            }
        }
    ]);

    testPostlude("raise domain event \"type\" attributes {\"a\":1,\"b\":2}", [
        {
            type: "RaiseEventStatement",
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            for_rid: null,
            event_attrs: {
                type: "RaiseEventAttributes",
                expression: mk({a: mk(1), b: mk(2)})
            }
        }
    ]);

    t.end();
});

test("select when ... foreach ...", function(t){
    var tst = function(rule_body, expected){
        var ast = parseRuleBody(rule_body);
        t.deepEquals(rmLoc(ast.foreach), expected);
    };

    tst("select when a b foreach [1,2,3] setting(c)", [{
        type: "RuleForEach",
        expression: mk([1, 2, 3]),
        setting: [mk.id("c")]
    }]);

    tst("select when a b foreach c setting(d, e)", [{
        type: "RuleForEach",
        expression: mk.id("c"),
        setting: [mk.id("d"), mk.id("e")]
    }]);

    var src = "";
    src += "select when a b\n";
    src += "foreach [1,2,3] setting(x)\n";
    src += '  foreach ["a", "b", "c"] setting(y)';
    tst(src, [
        {
            type: "RuleForEach",
            expression: mk([1, 2, 3]),
            setting: [mk.id("x")]
        },
        {
            type: "RuleForEach",
            expression: mk(["a", "b", "c"]),
            setting: [mk.id("y")]
        }
    ]);

    t.end();
});

test("GuardCondition", function(t){
    var testPost = function(postlude, expected){
        var src = "ruleset rs{rule r1{fired{" + postlude + "}}}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals(ast.rules[0].postlude.fired, normalizeAST(expected));
    };

    testPost("raise domain event \"type\" on final", [
        {
            type: "GuardCondition",
            condition: "on final",
            statement: {
                type: "RaiseEventStatement",
                event_domain: mk.id("domain"),
                event_type: mk("type"),
                for_rid: null,
                event_attrs: null
            }
        }
    ]);

    testPost("ent:foo := bar on final", [
        {
            type: "GuardCondition",
            condition: "on final",
            statement: {
                type: "PersistentVariableAssignment",
                op: ":=",
                left: mk.dID("ent", "foo"),
                path_expression: null,
                right: mk.id("bar")
            }
        }
    ]);

    testPost("foo = bar on final", [
        {
            type: "GuardCondition",
            condition: "on final",
            statement: mk.declare("=", mk.id("foo"), mk.id("bar"))
        }
    ]);

    testPost("foo = bar if baz > 0", [
        {
            type: "GuardCondition",
            condition: mk.op(">", mk.id("baz"), mk(0)),
            statement: mk.declare("=", mk.id("foo"), mk.id("bar"))
        }
    ]);

    testPost("ent:foo := bar if baz > 0", [
        {
            type: "GuardCondition",
            condition: mk.op(">", mk.id("baz"), mk(0)),
            statement: {
                type: "PersistentVariableAssignment",
                op: ":=",
                left: mk.dID("ent", "foo"),
                path_expression: null,
                right: mk.id("bar")
            }
        }
    ]);

    testPost("raise domain event \"type\" if baz > 0", [
        {
            type: "GuardCondition",
            condition: mk.op(">", mk.id("baz"), mk(0)),
            statement: {
                type: "RaiseEventStatement",
                event_domain: mk.id("domain"),
                event_type: mk("type"),
                for_rid: null,
                event_attrs: null
            }
        }
    ]);

    t.end();
});

test("DefAction", function(t){
    var tstDA = function(global, pre, expected){
        var src = "ruleset rs{global{"+ global +"}rule r1{pre{"+pre+"}}}";
        var ast = normalizeAST(rmLoc(parser(src)));
        t.deepEquals([
            ast.global,
            ast.rules[0].prelude
        ], normalizeAST(expected));
    };

    tstDA('a = defaction(){send_directive("foo")}', "", [
        [
            {
                type: "DefAction",
                id: mk.id("a"),
                params: [],
                body: [],
                actions: [
                    {
                        type: "RuleAction",
                        label: null,
                        action: mk.id("send_directive"),
                        args: [mk("foo")],
                        setting: null,
                        "with": []
                    }
                ]
            }
        ],
        []
    ]);

    tstDA("", 'a = defaction(){send_directive("foo")}', [
        [],
        [
            {
                type: "DefAction",
                id: mk.id("a"),
                params: [],
                body: [],
                actions: [
                    {
                        type: "RuleAction",
                        label: null,
                        action: mk.id("send_directive"),
                        args: [mk("foo")],
                        setting: null,
                        "with": []
                    }
                ]
            }
        ]
    ]);

    tstDA('a = defaction(b, c){d = 2 e = 3 send_directive("foo") with f = 4 g=5 noop()}', "", [
        [
            {
                type: "DefAction",
                id: mk.id("a"),
                params: [mk.id("b"), mk.id("c")],
                body: [
                    mk.declare("=", mk.id("d"), mk(2)),
                    mk.declare("=", mk.id("e"), mk(3))
                ],
                actions: [
                    {
                        type: "RuleAction",
                        label: null,
                        action: mk.id("send_directive"),
                        args: [mk("foo")],
                        setting: null,
                        "with": [
                            mk.declare("=", mk.id("f"), mk(4)),
                            mk.declare("=", mk.id("g"), mk(5))
                        ]
                    },
                    {
                        type: "RuleAction",
                        label: null,
                        action: mk.id("noop"),
                        args: [],
                        setting: null,
                        "with": []
                    }
                ]
            }
        ],
        []
    ]);


    t.end();
});

test("with", function(t){
    var tst = function(src, expected){
        var ast = parser("foo() " + src);
        ast = ast[0].expression.with;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));

        //try with on raise
        ast = parser("ruleset rs{rule r1{fired{raise domain event \"type\"" + src + "}}}");
        ast = ast.rules[0].postlude.fired[0].event_attrs.with;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };
    try{
        tst("with", []);
        t.fail();
    }catch(e){
        t.ok("should fail");
    }
    tst('with a = "b"', [
        mk.declare("=", mk.id("a"), mk("b"))
    ]);
    tst('with a = "b" c = "d"', [
        mk.declare("=", mk.id("a"), mk("b")),
        mk.declare("=", mk.id("c"), mk("d")),
    ]);
    tst('with a = "b" and = "d"', [
        mk.declare("=", mk.id("a"), mk("b")),
        mk.declare("=", mk.id("and"), mk("d")),
    ]);
    tst('with a = "b" and c = "d"', [
        mk.declare("=", mk.id("a"), mk("b")),
        mk.declare("=", mk.id("c"), mk("d")),
    ]);
    tst('with a = "b" and c = "d" and e = 1', [
        mk.declare("=", mk.id("a"), mk("b")),
        mk.declare("=", mk.id("c"), mk("d")),
        mk.declare("=", mk.id("e"), mk(1)),
    ]);
    try{
        tst('with a = "b" and c = "d" e = 1', []);
        t.fail();
    }catch(e){
        t.ok("should fail: don't use and for all, or not at all");
    }
    try{
        tst('with a = "b" c = "d" and e = 1', []);
        t.fail();
    }catch(e){
        t.ok("should fail: don't use and for all, or not at all");
    }
    try{
        tst('with a = "b" with c = "d"', []);
        t.fail();
    }catch(e){
        t.ok("should fail: only one 'with' is allowed");
    }
    t.end();
});

test("LogStatement", function(t){
    var testPostlude = function(src_core, expected){
        var src = "ruleset rs{rule a{ fired{" + src_core + "}}}";
        var ast = parser(src).rules[0].postlude.fired;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };

    testPostlude("log info \"foo\"", [{
        type: "LogStatement",
        level: "info",
        expression: mk("foo")
    }]);

    testPostlude("log error {\"baz\": [1, 2]}", [{
        type: "LogStatement",
        level: "error",
        expression: mk({baz: mk([1, 2])})
    }]);

    t.end();
});

test("Action setting", function(t){
    var testAction = function(src_action, expected){
        var src = "ruleset rs{rule r1{select when a b; "+src_action+"}}";
        var ast = parser(src).rules[0].action_block.actions[0];
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));

        //test it also in defaction
        src = "ruleset rs{global{a=defaction(){"+src_action+"}}}";
        ast = parser(src).global[0].actions[0];
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };

    testAction("http:post(\"url\") with qs = {\"foo\": \"bar\"}", {
        type: "RuleAction",
        label: null,
        action: mk.dID("http", "post"),
        args: [mk("url")],
        setting: null,
        "with": [
            mk.declare("=", mk.id("qs"), mk({foo: mk("bar")}))
        ]
    });

    testAction("http:post(\"url\") setting(resp)", {
        type: "RuleAction",
        label: null,
        action: mk.dID("http", "post"),
        args: [mk("url")],
        setting: mk.id("resp"),
        "with": []
    });

    testAction("http:post(\"url\") setting(resp) with qs = {\"foo\": \"bar\"}", {
        type: "RuleAction",
        label: null,
        action: mk.dID("http", "post"),
        args: [mk("url")],
        setting: mk.id("resp"),
        "with": [
            mk.declare("=", mk.id("qs"), mk({foo: mk("bar")}))
        ]
    });

    t.end();
});

test("schedule event", function(t){

    var testPostlude = function(src_core, expected){
        var src = "ruleset rs{rule a{ fired{" + src_core + "}}}";
        var ast = parser(src).rules[0].postlude.fired;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };

    testPostlude("schedule domain event \"type\" at \"time\"", [
        {
            type: "ScheduleEventStatement",
            at: mk("time"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: null,
            setting: null,
        }
    ]);

    testPostlude("schedule domain event \"type\" at \"time\" with a = 1 and b = 2", [
        {
            type: "ScheduleEventStatement",
            at: mk("time"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: {
                type: "RaiseEventAttributes",
                "with": [
                    mk.declare("=", mk.id("a"), mk(1)),
                    mk.declare("=", mk.id("b"), mk(2))
                ]
            },
            setting: null,
        }
    ]);

    testPostlude("schedule domain event \"type\" at \"time\" attributes {\"a\":1,\"b\":2}", [
        {
            type: "ScheduleEventStatement",
            at: mk("time"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: {
                type: "RaiseEventAttributes",
                expression: mk({a: mk(1), b: mk(2)})
            },
            setting: null,
        }
    ]);

    testPostlude("schedule domain event \"type\" at \"time\" setting(foo)", [
        {
            type: "ScheduleEventStatement",
            at: mk("time"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: null,
            setting: mk.id("foo"),
        }
    ]);

    testPostlude("schedule domain event \"type\" at \"time\" attributes {} setting(foo)", [
        {
            type: "ScheduleEventStatement",
            at: mk("time"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: {
                type: "RaiseEventAttributes",
                expression: mk({})
            },
            setting: mk.id("foo"),
        }
    ]);

    testPostlude("schedule domain event \"type\" repeat \"5 0 * * *\"", [
        {
            type: "ScheduleEventStatement",
            timespec: mk("5 0 * * *"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: null,
            setting: null,
        }
    ]);

    testPostlude("schedule domain event \"type\" repeat \"5 0 * * *\" with a = 1 and b = 2", [
        {
            type: "ScheduleEventStatement",
            timespec: mk("5 0 * * *"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: {
                type: "RaiseEventAttributes",
                "with": [
                    mk.declare("=", mk.id("a"), mk(1)),
                    mk.declare("=", mk.id("b"), mk(2))
                ]
            },
            setting: null,
        }
    ]);

    testPostlude("schedule domain event \"type\" repeat \"5 0 * * *\" attributes {\"a\":1,\"b\":2}", [
        {
            type: "ScheduleEventStatement",
            timespec: mk("5 0 * * *"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: {
                type: "RaiseEventAttributes",
                expression: mk({a: mk(1), b: mk(2)})
            },
            setting: null,
        }
    ]);

    testPostlude("schedule domain event \"type\" repeat \"5 0 * * *\" setting(foo)", [
        {
            type: "ScheduleEventStatement",
            timespec: mk("5 0 * * *"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: null,
            setting: mk.id("foo"),
        }
    ]);

    testPostlude("schedule domain event \"type\" repeat \"5 0 * * *\" attributes {} setting(foo)", [
        {
            type: "ScheduleEventStatement",
            timespec: mk("5 0 * * *"),
            event_domain: mk.id("domain"),
            event_type: mk("type"),
            event_attrs: {
                type: "RaiseEventAttributes",
                expression: mk({})
            },
            setting: mk.id("foo"),
        }
    ]);

    t.end();
});

test("LastStatement", function(t){
    var testPostlude = function(src_core, expected){
        var src = "ruleset rs{rule a{ fired{" + src_core + "}}}";
        var ast = parser(src).rules[0].postlude.fired;
        t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
    };

    testPostlude("last", [{
        type: "LastStatement",
    }]);

    testPostlude("last if(x==4)", [{
        type: "GuardCondition",
        condition: mk.op("==", mk.id("x"), mk(4)),
        statement: {
            type: "LastStatement",
        }
    }]);

    testPostlude("last if x == 4", [{
        type: "GuardCondition",
        condition: mk.op("==", mk.id("x"), mk(4)),
        statement: {
            type: "LastStatement",
        }
    }]);

    t.end();
});
