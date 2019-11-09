import * as ast from "./types";
import { Token } from "./types";

// inspired by http://crockford.com/javascript/tdop/tdop.html

class ParseError extends Error {
  public token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.name = "ParseError";
    this.token = token;
  }
}

interface State {
  tokens: Token[];
  token_i: number;
  curr?: {
    rule: Rule;
    token: Token;
  };
}

interface Rule {
  id: string;

  nud?: (state: State, token: Token) => ast.Node;

  lbp?: number;
  led?: (state: State, token: Token, left: ast.Node) => ast.Node;

  sta?: (state: State) => ast.Node;
}

const rules: { [id: string]: Rule } = {};

function defRule(id: string, rule: Omit<Rule, "id">) {
  rules[id] = { id, ...rule };

  if (!rules[id].lbp) {
    rules[id].lbp = 0;
  }
}

function advance(state: State) {
  // get next token
  let token: Token | null = null;
  let found = false;
  while (state.token_i < state.tokens.length) {
    token = state.tokens[state.token_i];
    state.token_i += 1;

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
      break;
    }
  }
  if (!token) return;

  if (!found && state.token_i >= state.tokens.length) {
    let srcLen = state.tokens[state.tokens.length - 1].loc.end;
    state.curr = {
      rule: rules["(end)"],
      token: {
        type: "WHITESPACE",
        src: "",
        loc: { start: srcLen, end: srcLen }
      }
    };
    return;
  }

  let rule: Rule | null = null;
  if (rules.hasOwnProperty(token.src)) {
    rule = rules[token.src];
  } else if (rules.hasOwnProperty(token.type)) {
    rule = rules[token.type];
  }

  if (!rule) {
    throw new ParseError("Unhandled token", token);
  }

  state.curr = { rule, token };
}

///////////////////////////////////////////////////////////////////////////////

defRule("(end)", {});

defRule("NUMBER", {
  nud(state, token) {
    return {
      loc: token.loc,
      type: "Number",
      value: parseFloat(token.src) || 0
    };
  }
});

///////////////////////////////////////////////////////////////////////////////

export function parse(
  tokens: Token[],
  entryParse: (state: State) => ast.Node
): ast.Node {
  let state: State = {
    tokens: tokens,
    token_i: 0,
    curr: void 0
  };

  advance(state);
  const tree = entryParse(state);

  if (!state.curr) {
    throw new Error("Nothing was parsed");
  }
  if (state.curr.rule.id !== "(end)") {
    throw new ParseError("Expected `(end)`", state.curr.token);
  }
  advance(state);

  return tree;
}
