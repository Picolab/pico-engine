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
  curr: {
    token_i: number;
    rule: Rule;
    token: Token;
  };
}

interface Rule {
  id: string;

  nud?: (state: State) => ast.Node;

  lbp: number;
  led?: (state: State, token: Token, left: ast.Node) => ast.Node;

  sta?: (state: State) => ast.Node;
}

const rules: { [id: string]: Rule } = {};

function defRule(id: string, rule: Omit<Omit<Rule, "id">, "lbp">) {
  rules[id] = { id, lbp: 0, ...rule };

  if (!rules[id].lbp) {
    rules[id].lbp = 0;
  }
}

function advanceBase(
  tokens: Token[],
  token_i: number
): { token_i: number; token: Token; rule: Rule } {
  // get next token
  let token: Token | null = null;
  let found = false;
  while (token_i < tokens.length) {
    token = tokens[token_i];

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
      token_i += 1;
      continue;
    }

    found = true;
    break;
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

function advance(state: State) {
  state.curr = advanceBase(state.tokens, state.curr.token_i + 1);
}

function expression(state: State, rbp: number = 0): ast.Node {
  if (!state.curr.rule.nud) {
    throw new ParseError("Expected an expression", state.curr.token);
  }
  let left = state.curr.rule.nud(state);
  advance(state);

  while (rbp < state.curr.rule.lbp) {
    let prev = state.curr;
    advance(state);
    if (!prev.rule.led) {
      throw new ParseError(
        "Rule does not have a .led " + prev.rule.id,
        prev.token
      );
    }
    left = prev.rule.led(state, prev.token, left);
  }
  return left;
}

function chomp(state: State, type: string, src: string) {
  if (state.curr.token.type !== type || state.curr.token.src !== src) {
    throw new ParseError("Expected `" + src + "`", state.curr.token);
  }
  advance(state);
}

function rulesetID(state: State): ast.RulesetID {
  if (state.curr.rule.id !== "SYMBOL") {
    throw new ParseError("Expected RulesetID", state.curr.token);
  }
  let rid = state.curr.token.src;
  let start = state.curr.token.loc.start;
  let end = state.curr.token.loc.end;

  while (true) {
    const nextT = state.tokens[state.curr.token_i + 1];
    if (nextT.type !== "RAW" || (nextT.src !== "." && nextT.src !== "-")) {
      break;
    }
    rid += nextT.src;
    const nextNextT = state.tokens[state.curr.token_i + 2];
    if (nextNextT.type !== "SYMBOL") {
      throw new ParseError(
        "RulesetID cannot end with a `" +
          nextT.src +
          "`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`",
        nextNextT
      );
    }
    state.curr = {
      token_i: state.curr.token_i + 2,
      token: state.tokens[state.curr.token_i + 2],
      rule: rules.SYMBOL
    };
    rid += state.curr.token.src;
    end = state.curr.token.loc.end;
  }
  advance(state);

  return {
    loc: { start, end },
    type: "RulesetID",
    value: rid
  };
}

function ruleset(state: State): ast.Ruleset {
  const start = state.curr.token.loc.start;
  chomp(state, "SYMBOL", "ruleset");

  const rid = rulesetID(state);

  chomp(state, "RAW", "{");

  const meta = rulesetMeta(state);

  // RulesetGlobal:?
  // Rule:*

  const end = state.curr.token.loc.end;
  chomp(state, "RAW", "}");

  return {
    loc: { start, end },
    type: "Ruleset",
    rid,
    meta
  };
}

function rulesetMeta(state: State): ast.RulesetMeta | null {
  if (state.curr.rule.id !== "SYMBOL" || state.curr.token.src !== "meta") {
    return null;
  }
  const start = state.curr.token.loc.start;
  advance(state);
  chomp(state, "RAW", "{");

  const properties: ast.RulesetMetaProperty[] = [];

  let prop: ast.RulesetMetaProperty | null = null;
  while ((prop = rulesetMetaProperty(state))) {
    properties.push(prop);
  }

  const end = state.curr.token.loc.end;
  chomp(state, "RAW", "}");

  return {
    loc: { start, end },
    type: "RulesetMeta",
    properties
  };
}

function rulesetMetaProperty(state: State): ast.RulesetMetaProperty | null {
  if (state.curr.rule.id !== "SYMBOL") {
    return null;
  }

  const key: ast.Keyword = {
    loc: state.curr.token.loc,
    type: "Keyword",
    value: state.curr.token.src
  };

  let value: ast.Node | null = null;

  switch (state.curr.token.src) {
    case "name":
    case "description":
    case "author":
      advance(state);
      value = expression(state, 0);
      break;
  }

  if (!value) {
    return null;
  }
  return {
    loc: { start: key.loc.start, end: value.loc.end },
    type: "RulesetMetaProperty",
    key,
    value
  };
}

///////////////////////////////////////////////////////////////////////////////

defRule("(end)", {});
defRule(".", {});
defRule("-", {});
defRule("{", {});
defRule("}", {});

defRule("SYMBOL", {});

defRule("NUMBER", {
  nud(state) {
    return {
      loc: state.curr.token.loc,
      type: "Number",
      value: parseFloat(state.curr.token.src) || 0
    };
  }
});

defRule("STRING", {
  nud(state) {
    return {
      loc: state.curr.token.loc,
      type: "String",
      value: state.curr.token.src
        .replace(/(^")|("$)/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
    };
  }
});

defRule("CHEVRON-OPEN", {
  nud(state) {
    const start = state.curr.token.loc.start;
    advance(state);

    const value: ast.Node[] = [];

    while (true) {
      if (state.curr.token.type === "CHEVRON-STRING") {
        value.push({
          loc: state.curr.token.loc,
          type: "String",
          value: state.curr.token.src
            .replace(/\\>/g, ">")
            .replace(/\\#{/g, "#{")
            .replace(/\\\\/g, "\\")
        });
        advance(state);
      } else if (state.curr.token.type === "CHEVRON-BEESTING-OPEN") {
        advance(state);
        value.push(expression(state));
        chomp(state, "CHEVRON-BEESTING-CLOSE", "}");
      } else {
        break;
      }
    }

    const end = state.curr.token.loc.end;
    // don't `chomp` b/c .nud should not advance beyond itself
    if (state.curr.token.type !== "CHEVRON-CLOSE") {
      throw new ParseError("Expected `>>`", state.curr.token);
    }

    return {
      loc: { start, end },
      type: "Chevron",
      value
    };
  }
});
defRule("CHEVRON-STRING", {});
defRule("CHEVRON-BEESTING-OPEN", {});
defRule("CHEVRON-BEESTING-CLOSE", {});
defRule("CHEVRON-CLOSE", {});

defRule("REGEXP", {
  nud(state) {
    const token = state.curr.token;
    const pattern = token.src
      .substring(3, token.src.lastIndexOf("#"))
      .replace(/\\#/g, "#");
    const modifiers = token.src.substring(token.src.lastIndexOf("#") + 1);
    return {
      loc: token.loc,
      type: "RegExp",
      value: new RegExp(pattern, modifiers)
    };
  }
});

///////////////////////////////////////////////////////////////////////////////

export function parse<OUT>(
  tokens: Token[],
  entryParse: (state: State) => OUT
): OUT {
  let state: State = {
    tokens: tokens,
    curr: advanceBase(tokens, 0)
  };

  const tree = entryParse(state);

  if (!state.curr) {
    throw new Error("Nothing was parsed");
  }
  if (state.curr.rule.id !== "(end)") {
    throw new ParseError(
      "Expected `(end)` but was " + state.curr.rule.id,
      state.curr.token
    );
  }
  advance(state);

  return tree;
}

export function parseExpression(tokens: Token[]) {
  return parse(tokens, function(state) {
    return expression(state, 0);
  });
}

export function parseRuleset(tokens: Token[]) {
  return parse(tokens, function(state) {
    return ruleset(state);
  });
}
