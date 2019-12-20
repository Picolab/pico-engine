import * as ast from "./types";
import { Token } from "./types";
export declare function parse(tokens: Token[]): ast.Ruleset | (ast.Declaration | ast.Expression)[];
export declare function parseExpression(tokens: Token[]): ast.Expression;
export declare function parseRuleset(tokens: Token[]): ast.Ruleset;
