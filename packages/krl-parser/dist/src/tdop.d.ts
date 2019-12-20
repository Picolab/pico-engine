import * as ast from "./types";
import { Token } from "./types";
export interface State {
    tokens: Token[];
    curr: {
        token_i: number;
        rule: Rule;
        token: Token;
    };
}
export interface Rule {
    id: string;
    nud?: (state: State, token: Token) => ast.Expression;
    lbp: number;
    led?: (state: State, token: Token, left: ast.Expression) => ast.Expression;
    event_nud?: (state: State, token: Token) => ast.EventExpression;
    event_lbp: number;
    event_led?: (state: State, token: Token, left: ast.EventExpression) => ast.EventExpression;
}
export declare function advanceBase(rules: {
    [id: string]: Rule;
} | undefined, tokens: Token[], token_i: number): {
    token_i: number;
    token: Token;
    rule: Rule;
};
export declare function lookahead(state: State, n: number): Token[];
export declare function easyLookahead(state: State, n: number): string;
