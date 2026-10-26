"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocComment = parseDocComment;
exports.isDocCommentToken = isDocCommentToken;
const ParseError_1 = require("./ParseError");
const TYPE_NAMES = new Set([
    "String",
    "Number",
    "Boolean",
    "Map",
    "Array",
    "Any"
]);
function parseQuotedString(input) {
    const trimmed = input.trimStart();
    if (!trimmed.startsWith('"')) {
        return null;
    }
    let i = 1;
    let value = "";
    while (i < trimmed.length) {
        const c = trimmed[i];
        if (c === "\\" && i + 1 < trimmed.length) {
            value += trimmed[i + 1];
            i += 2;
            continue;
        }
        if (c === '"') {
            return { value, rest: trimmed.slice(i + 1) };
        }
        value += c;
        i++;
    }
    return null;
}
function splitRest(rest) {
    const parts = [];
    let s = rest.trim();
    while (s.length > 0) {
        const quoted = parseQuotedString(s);
        if (quoted) {
            parts.push(quoted.value);
            s = quoted.rest.trim();
            continue;
        }
        const m = /^(\S+)/.exec(s);
        if (!m)
            break;
        parts.push(m[1]);
        s = s.slice(m[1].length).trim();
    }
    return parts;
}
function parseAttrTag(rest, token) {
    const parts = splitRest(rest);
    if (parts.length === 0) {
        throw new ParseError_1.ParseError("@attr requires a name", token);
    }
    const name = parts[0];
    let i = 1;
    let type;
    let optional = false;
    let description;
    if (i < parts.length && TYPE_NAMES.has(parts[i])) {
        type = parts[i];
        i++;
    }
    if (i < parts.length && parts[i] === "optional") {
        optional = true;
        i++;
    }
    if (i < parts.length) {
        description = parts.slice(i).join(" ");
    }
    return {
        kind: "attr",
        name,
        type: type || "Any",
        optional,
        description
    };
}
function parseParamTag(rest, token) {
    const parts = splitRest(rest);
    if (parts.length === 0) {
        throw new ParseError_1.ParseError("@param requires a name", token);
    }
    const name = parts[0];
    let i = 1;
    let type;
    let description;
    if (i < parts.length && TYPE_NAMES.has(parts[i])) {
        type = parts[i];
        i++;
    }
    if (i < parts.length) {
        description = parts.slice(i).join(" ");
    }
    return {
        kind: "param",
        name,
        type: type || "Any",
        description
    };
}
function parseExampleTag(rest, token) {
    const trimmed = rest.trimStart();
    const quoted = parseQuotedString(trimmed);
    if (!quoted) {
        throw new ParseError_1.ParseError('@example requires a quoted name', token);
    }
    const jsonPart = quoted.rest.trim();
    if (!jsonPart.startsWith("{")) {
        throw new ParseError_1.ParseError("@example requires a JSON map after the name", token);
    }
    let data;
    try {
        data = JSON.parse(jsonPart);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new ParseError_1.ParseError(`@example JSON map is invalid: ${msg}`, token);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new ParseError_1.ParseError("@example JSON must be a map object", token);
    }
    return {
        kind: "example",
        name: quoted.value,
        data: data
    };
}
function parseReturnsTag(rest, token) {
    const parts = splitRest(rest);
    if (parts.length === 0) {
        throw new ParseError_1.ParseError("@returns requires a type", token);
    }
    let type = parts[0];
    if (!TYPE_NAMES.has(type)) {
        throw new ParseError_1.ParseError(`Unknown type in @returns: ${type}`, token);
    }
    const description = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    return { kind: "returns", type, description };
}
function parseDocComment(token) {
    if (token.type !== "BLOCK-COMMENT" || !token.src.startsWith("/**")) {
        throw new ParseError_1.ParseError("Expected /** doc comment", token);
    }
    let inner = token.src.slice(3);
    if (inner.endsWith("*/")) {
        inner = inner.slice(0, -2);
    }
    const rawLines = inner.split(/\r?\n/);
    const lines = rawLines.map(line => line.replace(/^\s*\*?\s?/, ""));
    const descriptionParagraphs = [];
    let descriptionLines = [];
    const tags = [];
    const unknownTags = [];
    let seenTag = false;
    function flushDescriptionParagraph() {
        if (descriptionLines.length === 0)
            return;
        descriptionParagraphs.push(descriptionLines.join(" "));
        descriptionLines = [];
    }
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
            if (!seenTag)
                flushDescriptionParagraph();
            continue;
        }
        const tagMatch = /^@(\w+)\s*(.*)$/.exec(trimmed);
        if (tagMatch) {
            if (!seenTag)
                flushDescriptionParagraph();
            seenTag = true;
            const tagName = tagMatch[1];
            const rest = tagMatch[2];
            switch (tagName) {
                case "attr":
                    tags.push(parseAttrTag(rest, token));
                    break;
                case "param":
                    tags.push(parseParamTag(rest, token));
                    break;
                case "returns":
                    tags.push(parseReturnsTag(rest, token));
                    break;
                case "example":
                    tags.push(parseExampleTag(rest, token));
                    break;
                default:
                    unknownTags.push({ name: tagName, rest });
                    break;
            }
        }
        else if (!seenTag) {
            descriptionLines.push(trimmed);
        }
    }
    flushDescriptionParagraph();
    const doc = {
        type: "DocComment",
        loc: token.loc,
        raw: token.src,
        description: descriptionParagraphs.join("\n\n").trim(),
        tags
    };
    if (unknownTags.length) {
        doc.unknownTags = unknownTags;
    }
    return doc;
}
function isDocCommentToken(token) {
    return token.type === "BLOCK-COMMENT" && token.src.startsWith("/**");
}
//# sourceMappingURL=docComment.js.map