module.exports = function(CodeMirror){
    CodeMirror.defineSimpleMode("krl", {
        start: [
            {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},

            {regex: /re#(?:[^\\]|\\.)*?#(?:ig?|gi?)?/, token: "string-2"},

            {
                regex: /(select)(\s+)(when)(\s+)([a-zA-Z0-9_$]+)(\s+)([a-zA-Z0-9_$]+)/,
                token: ["keyword", null, "keyword", null, "tag", null, "tag"]
            },

            {
                regex: /([a-zA-Z_$]+)(\s*):(\s*)([a-zA-Z_$]+)/,
                token: ["variable-2", null, "operator", null, "variable"]
            },

            {
                regex: /(?:ruleset|meta|global|rule|pre|always|fired|notfired|setting|function|if|then|else|raise|attributes)\b/,
                token: "keyword"
            },
            {
                regex: /(?:shares?|provides?)\b/,
                token: "def"
            },
            {
                regex: /(?:send_directive|noop)\b/,
                token: "builtin"
            },

            {
                regex: /true|false|null/,
                token: "atom"
            },

            {regex: /[a-zA-Z_$][a-zA-Z_$0-9]*/, token: "variable"},

            {
                regex: /[-+]?(?:\.\d+|\d+\.?\d*)/i,
                token: "number"
            },

            {regex: /\/\/.*/, token: "comment"},
            {regex: /\/\*/, token: "comment", next: "comment"},
            {regex: /<</, token: "string", next: "chevron"},

            {regex: /[-+\/*=<>!]+/, token: "operator"},
            {regex: /:=/, token: "operator"},

            {regex: /[\{\[\(]/, indent: true, token: "bracket"},
            {regex: /[\}\]\)]/, dedent: true, token: "bracket"},

            {regex: /[,;]+/, token: "punctuation"},
        ],

        // The multi-line comment state.
        comment: [
            {regex: /.*?\*\//, token: "comment", next: "start"},
            {regex: /.*/, token: "comment"}
        ],

        // The multi-line chevron
        chevron: [
            {regex: /.*?>>/, token: "string", next: "start"},
            {regex: /.*/, token: "string"}
        ],

        meta: {
            dontIndentStates: ["comment"],
            lineComment: "//"
        }
    });

    CodeMirror.defineMIME("text/x-krl", "krl");
};
