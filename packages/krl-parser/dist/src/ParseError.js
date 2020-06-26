"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseError = void 0;
const lineColumn = require("line-column");
const excerptAtLineCol = require("excerpt-at-line-col");
class ParseError extends Error {
    constructor(message, token) {
        super(message);
        this.name = "ParseError";
        this.token = token;
    }
    setupWhere(src, filename) {
        const { line, col } = lineColumn(src, Math.min(this.token.loc.start, src.length - 1));
        this.where = {
            filename,
            line,
            col,
            locationString: filename + ":" + line + ":" + col,
            excerpt: excerptAtLineCol(src, line - 1, col - 1, 3),
            excerptOneLine: excerptAtLineCol(src, line - 1, col - 1, 0)
        };
    }
}
exports.ParseError = ParseError;
//# sourceMappingURL=ParseError.js.map