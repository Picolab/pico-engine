"use strict";
const krl_1 = require("./krl");
const tokenizer_1 = require("../src/tokenizer");
function parseKRL(src, opts) {
    opts = opts || {};
    try {
        const tokens = (0, tokenizer_1.default)(src);
        const tree = (0, krl_1.parse)(tokens);
        return tree;
    }
    catch (e) {
        if (e && e.setupWhere) {
            e.setupWhere(src, opts.filename || "");
        }
        throw e;
    }
}
module.exports = parseKRL;
//# sourceMappingURL=index.js.map