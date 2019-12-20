//FOR help see:
//  https://ace.c9.io/#nav=higlighter
//  https://ace.c9.io/tool/mode_creator.html

require("brace/mode/javascript");// import things like ace/mode/matching_brace_outdent and ace/mode/folding/cstyle

var WORKER_SRC = require("ace-webworker-loader!./worker");

ace.define("ace/mode/krl_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/doc_comment_highlight_rules","ace/mode/text_highlight_rules"], function(acequire, exports, module) {
"use strict";

var oop = acequire("../lib/oop");
var DocCommentHighlightRules = acequire("./doc_comment_highlight_rules").DocCommentHighlightRules;
var TextHighlightRules = acequire("./text_highlight_rules").TextHighlightRules;

var KRLHighlightRules = function(options) {

    var keywordMapper = this.createKeywordMapper({

        "keyword":
            "ruleset|meta|global|rule|pre|always|fired|notfired|finally|" +
            "function|return|defaction|setting|" +
            "if|then|else|choose|every|" + // conditionals
            "raise|attributes", // raise

        "variable.language":
            "send_directive|noop",

        "constant.language": "null|Infinity",
        "constant.language.boolean": "true|false"

    }, "identifier");

    var identifierRe = "[a-zA-Z_$][a-zA-Z0-9_$]*";

    var escapedRe = "\\\\(?:x[0-9a-fA-F]{2}|" + // hex
        "u[0-9a-fA-F]{4}|" + // unicode
        "u{[0-9a-fA-F]{1,6}}|" + // es6 unicode
        "[0-2][0-7]{0,2}|" + // oct
        "3[0-7][0-7]?|" + // oct
        "[4-7][0-7]?|" + //oct
        ".)";

    this.$rules = {
        "start" : [
            DocCommentHighlightRules.getStartRule("doc-start"),
            comments("start"),
            {
                regex : "\\s+|^$",
                token : "text",
                next : "start",
            }, {
                regex: "re#",
                token: "string.regexp",
                next: "regex"
            }, {
                regex : '"(?=.)',
                token : "string",
                next  : "qqstring"
            }, {
                // Chevrons <<hello #{getName()}!>>
                regex : /<</,
                token : "string.quasi.start",
                push  : [
                    {
                        token : "constant.language.escape",
                        regex : escapedRe
                    }, {
                        token : "paren.quasi.start",
                        regex : /#{/,
                        push  : "start"
                    }, {
                        token : "string.quasi.end",
                        regex : />>/,
                        next  : "pop"
                    }, {
                        defaultToken: "string.quasi"
                    }
                ]
            }, {
                //Count curlies for beestings
                regex: "[{}]",
                onMatch: function(val, state, stack) {
                    this.next = val == "{" ? this.nextState : "";
                    if (val == "{" && stack.length) {
                        stack.unshift("start", state);
                    } else if (val == "}" && stack.length) {
                        stack.shift();
                        this.next = stack.shift();
                        if (this.next.indexOf("string") != -1)
                            return "paren.quasi.end";
                    }
                    return val == "{" ? "paren.lparen" : "paren.rparen";
                },
                nextState: "start",
            }, {
                regex : /(?:\d\d*(?:\.\d*)?|\.\d+)/,
                token : "constant.numeric", // decimal integers and floats
            }, {
                regex: "(ruleset)(\\s+)([a-zA-Z0-9_.-]+)",
                token: ["keyword", "text", "variable"]
            }, {
                regex: "rule\\s+" + identifierRe + "\\s+is\\s+inactive",
                token: "comment",
                // TODO comment out the entire rule body
            }, {
                regex: "(rule)(\\s+)(" + identifierRe + ")(\\s+)(is)(\\s+)(active)",
                token: ["keyword", "text", "variable", "text", "keyword", "text", "constant.language"]
            }, {
                regex: "(rule)(\\s+)(" + identifierRe + ")(\\s+)",
                token: ["keyword", "text", "variable", "text"]
            }, {
                regex: "(select)(\\s+)(when)(\\s+)(" + identifierRe + ")(\\s+)(" + identifierRe + ")",
                token: ["keyword", "text", "keyword", "text", "variable", "text", "variable"]
                //TODO state machine to handle EventExpressions
            }, {
                regex: "(select)(\\s+)(when)(\\s+)(" + identifierRe + ")(\\s*:\\s*)(" + identifierRe + ")",
                token: ["keyword", "text", "keyword", "text", "variable", "text", "variable"]
                //TODO state machine to handle EventExpressions
            }, {
                regex : "(" + identifierRe + ")(\\s*:\\s*)(" + identifierRe + ")",
                token : ["keyword", "text", "variable.parameter"],
            }, {
                //krl-stdlib operators
                regex : "(\\.)(\\s*)(" + identifierRe + ")\\b",
                token : ["punctuation.operator", "text", "variable.language"],
            }, {
                regex : identifierRe,
                token : keywordMapper,
            }, {
                regex : /--|\+\+|\.{3}|===|==|=|!=|!==|<+=?|>+=?|!|&&|\|\||\?:|[!$%&*+\-~\/^]=?/,
                token : "keyword.operator",
                next  : "start"
            }, {
                regex : /[?:,;.]/,
                token : "punctuation.operator",
                next  : "start"
            }, {
                regex : /[\[({]/,
                token : "paren.lparen",
                next  : "start"
            }, {
                regex : /[\])}]/,
                token : "paren.rparen",
            }
        ],
        "regex": [
            {
                regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)",
                token: "regexp.keyword.operator",
            }, {
                regex: "#(?:ig?|gi?)?",
                token: "string.regexp",
                next: "start"
            }, {
                regex: /\{\d+\b,?\d*\}[+*]|[+*$^?][+*]|[$^][?]|\?{3,}/,
                token : "invalid",
            }, {
                regex: /\(\?[:=!]|\)|\{\d+\b,?\d*\}|[+*]\?|[()$^+*?.]/,
                token : "constant.language.escape",
            }, {
                regex: /\|/,
                token : "constant.language.delimiter",
            }, {
                regex: /\[\^?/,
                token: "constant.language.escape",
                next: "regex_character_class"
            }, {
                regex: "$",
                token: "empty",
                next: "start"
            }, {
                defaultToken: "string.regexp"
            }
        ],
        "regex_character_class": [
            {
                regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)",
                token: "regexp.charclass.keyword.operator",
            }, {
                regex: "]",
                token: "constant.language.escape",
                next: "regex"
            }, {
                regex: "-",
                token: "constant.language.escape",
            }, {
                regex: "$",
                token: "empty",
                next: "start"
            }, {
                defaultToken: "string.regexp.charachterclass"
            }
        ],
        "qqstring" : [
            {
                regex : escapedRe,
                token : "constant.language.escape",
            }, {
                regex : "\\\\$",
                token : "string",
                consumeLineEnd  : true
            }, {
                regex : '"|$',
                token : "string",
                next  : "start"
            }, {
                defaultToken: "string"
            }
        ],
    };

    this.embedRules(DocCommentHighlightRules, "doc-",
        [ DocCommentHighlightRules.getEndRule("start") ]);

    this.normalizeRules();
};

oop.inherits(KRLHighlightRules, TextHighlightRules);

function comments(next) {
    return [
        {
            regex : /\/\*/,
            token : "comment", // multi line comment
            next: [
                DocCommentHighlightRules.getTagRule(),
                {token : "comment", regex : "\\*\\/", next : next || "pop"},
                {defaultToken : "comment", caseInsensitive: true}
            ]
        }, {
            regex : "\\/\\/",
            token : "comment",
            next: [
                DocCommentHighlightRules.getTagRule(),
                {token : "comment", regex : "$|^", next : next || "pop"},
                {defaultToken : "comment", caseInsensitive: true}
            ]
        }
    ];
}
exports.KRLHighlightRules = KRLHighlightRules;
});

ace.define("ace/mode/krl",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/krl_highlight_rules","ace/mode/matching_brace_outdent","ace/worker/worker_client","ace/mode/behaviour/cstyle","ace/mode/folding/cstyle"], function(acequire, exports, module) {
"use strict";

var oop = acequire("../lib/oop");
var TextMode = acequire("./text").Mode;
var KRLHighlightRules = acequire("./krl_highlight_rules").KRLHighlightRules;
var MatchingBraceOutdent = acequire("./matching_brace_outdent").MatchingBraceOutdent;
var WorkerClient = acequire("../worker/worker_client").WorkerClient;
var CstyleBehaviour = acequire("./behaviour/cstyle").CstyleBehaviour;
var CStyleFoldMode = acequire("./folding/cstyle").FoldMode;

var Mode = function() {
    this.HighlightRules = KRLHighlightRules;
    
    this.$outdent = new MatchingBraceOutdent();
    this.$behaviour = new CstyleBehaviour();
    this.foldingRules = new CStyleFoldMode();
};
oop.inherits(Mode, TextMode);

(function() {

    this.lineCommentStart = "//";
    this.blockComment = {start: "/*", end: "*/"};
    this.$quotes = {'"': '"', "<<": ">>"};

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        if (state == "start") {
            var match = line.match(/^.*(?:\bcase\b.*:|[\{\(\[])\s*$/);
            if (match) {
                indent += tab;
            }
        } else if (state == "doc-start") {
            if (endState == "start") {
                return "";
            }
            var match = line.match(/^\s*(\/?)\*/);
            if (match) {
                if (match[1]) {
                    indent += " ";
                }
                indent += "* ";
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };

    this.createWorker = function(session) {

        var worker = new WorkerClient(["ace"], {
            id: "ace/mode/krl_worker",
            src: WORKER_SRC,
        }, "KRLWorker");

        worker.attachToDocument(session.getDocument());

        worker.on("annotate", function(results) {
            session.setAnnotations(results.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };

    this.$id = "ace/mode/krl";
}).call(Mode.prototype);

exports.Mode = Mode;
});
