import { ParseError } from "./ParseError";
import * as ast from "./types";
import { Token } from "./types";

// inspired by http://crockford.com/javascript/tdop/tdop.html

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

  // event expression
  event_nud?: (state: State, token: Token) => ast.EventExpression;
  event_lbp: number;
  event_led?: (
    state: State,
    token: Token,
    left: ast.EventExpression
  ) => ast.EventExpression;
}

function checkSignificantToken(token: Token): boolean {
  if (token.type === "MISSING-CLOSE") {
    throw new ParseError("Missing close " + token.missingClose, token);
  }
  if (token.type === "ILLEGAL") {
    throw new ParseError("Unsupported characters", token);
  }
  if (
    token.type === "WHITESPACE" ||
    token.type === "LINE-COMMENT" ||
    token.type === "BLOCK-COMMENT"
  ) {
    return false;
  }
  return true;
}

export function advanceBase(
  rules: { [id: string]: Rule } = {},
  tokens: Token[],
  token_i: number
): { token_i: number; token: Token; rule: Rule } {
  // get next token
  let token: Token | null = null;
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

  let rule: Rule | null = null;
  if (rules.hasOwnProperty(token.src)) {
    rule = rules[token.src];
  } else if (rules.hasOwnProperty(token.type)) {
    rule = rules[token.type];
  }

  if (!rule) {
    throw new ParseError(
      "Unhandled token. Available rules: " + JSON.stringify(Object.keys(rules)),
      token
    );
  }

  return { token_i, token, rule };
}

export function lookahead(state: State, n: number): Token[] {
  let token: Token | null = null;
  let found: Token[] = [];
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

export function easyLookahead(state: State, n: number): string {
  return lookahead(state, n)
    .map(tok => (tok.type === "RAW" ? tok.src : tok.type))
    .join("");
}
