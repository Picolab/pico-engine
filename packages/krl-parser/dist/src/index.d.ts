declare function parseKRL(src: string, opts?: {
    filename?: string;
}): import("./types").Ruleset | (import("./types").Expression | import("./types").Declaration)[];
export = parseKRL;
