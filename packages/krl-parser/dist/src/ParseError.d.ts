import { Token } from "./types";
export declare class ParseError extends Error {
    token: Token;
    constructor(message: string, token: Token);
    where?: {
        filename: string;
        line: number;
        col: number;
        locationString: string;
        excerpt: string;
        excerptOneLine: string;
    };
    setupWhere(src: string, filename: string): void;
}
