declare function parseKRL(src: string, opts?: {
    filename?: string;
}): import("./types").Ruleset | (import("./types").Number | import("./types").Boolean | import("./types").Null | import("./types").String | import("./types").Chevron | import("./types").KrlRegExp | import("./types").Identifier | import("./types").DomainIdentifier | import("./types").InfixOperator | import("./types").UnaryOperator | import("./types").ConditionalExpression | import("./types").MemberExpression | import("./types").Function | import("./types").DefAction | import("./types").Application | import("./types").Array | import("./types").Map | import("./types").Declaration)[];
export = parseKRL;
