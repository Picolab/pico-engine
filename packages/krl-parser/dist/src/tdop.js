"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.easyLookahead = exports.lookahead = exports.advanceBase = void 0;
const ParseError_1 = require("./ParseError");
function checkSignificantToken(token) {
    if (token.type === "MISSING-CLOSE") {
        throw new ParseError_1.ParseError("Missing close " + token.missingClose, token);
    }
    if (token.type === "ILLEGAL") {
        throw new ParseError_1.ParseError("Unsupported characters", token);
    }
    if (token.type === "WHITESPACE" ||
        token.type === "LINE-COMMENT" ||
        token.type === "BLOCK-COMMENT") {
        return false;
    }
    return true;
}
function advanceBase(rules = {}, tokens, token_i) {
    // get next token
    let token = null;
    let found = false;
    while (token_i < tokens.length) {
        token = tokens[token_i];
        if (checkSignificantToken(token)) {
            found = true;
            break;
        }
        token_i += 1;
    }
    if (!token || (!found && token_i >= tokens.length)) {
        const index = tokens[tokens.length - 1].loc.end;
        return {
            token_i: tokens.length,
            token: {
                type: "WHITESPACE",
                src: "",
                loc: { start: index, end: index }
            },
            rule: rules["(end)"]
        };
    }
    let rule = null;
    if (rules.hasOwnProperty(token.src)) {
        rule = rules[token.src];
    }
    else if (rules.hasOwnProperty(token.type)) {
        rule = rules[token.type];
    }
    if (!rule) {
        throw new ParseError_1.ParseError("Unhandled token. Available rules: " + JSON.stringify(Object.keys(rules)), token);
    }
    return { token_i, token, rule };
}
exports.advanceBase = advanceBase;
function lookahead(state, n) {
    let token = null;
    let found = [];
    let i = state.curr.token_i;
    while (i < state.tokens.length && found.length < n) {
        token = state.tokens[i];
        if (checkSignificantToken(token)) {
            found.push(token);
        }
        i++;
    }
    return found;
}
exports.lookahead = lookahead;
function easyLookahead(state, n) {
    return lookahead(state, n)
        .map(tok => (tok.type === "RAW" ? tok.src : tok.type))
        .join("");
}
exports.easyLookahead = easyLookahead;
//# sourceMappingURL=tdop.js.map