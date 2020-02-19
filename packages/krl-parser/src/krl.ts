import { ParseError } from "./ParseError";
import { advanceBase, easyLookahead, lookahead, Rule, State } from "./tdop";
import * as ast from "./types";
import { Token } from "./types";

const rules: { [id: string]: Rule } = {};

function defRule(id: string, rule: Partial<Omit<Rule, "id">>) {
  const base: Rule = rules[id] || { id, lbp: 0, event_lbp: 0 };
  rules[id] = { ...base, ...rule };
}

function advance(state: State) {
  state.curr = advanceBase(rules, state.tokens, state.curr.token_i + 1);
  return state;
}

function chomp(state: State, type: ast.TokenType, src: string) {
  if (state.curr.token.type !== type || state.curr.token.src !== src) {
    throw new ParseError("Expected `" + src + "`", state.curr.token);
  }
  advance(state);
}

function chompMaybe(state: State, type: ast.TokenType, src: string): boolean {
  if (state.curr.token.type !== type || state.curr.token.src !== src) {
    return false;
  }
  advance(state);
  return true;
}

function chompString(state: State): ast.String {
  if (state.curr.token.type !== "STRING") {
    throw new ParseError("Expected String", state.curr.token);
  }
  const node = expression(state);
  return node as ast.String;
}

function chompPositiveInteger(state: State): ast.Number {
  if (
    state.curr.token.type === "NUMBER" &&
    /^[0-9]+$/.test(state.curr.token.src)
  ) {
    const value = parseInt(state.curr.token.src, 10);
    if (value >= 0 && value === value) {
      advance(state);
      return { loc: state.curr.token.loc, type: "Number", value };
    }
  }
  throw new ParseError("Expected a positive integer", state.curr.token);
}

function chompWord(
  state: State,
  expectedWhat: string = "word"
): ast.Identifier {
  if (state.curr.token.type !== "SYMBOL") {
    throw new ParseError("Expected " + expectedWhat, state.curr.token);
  }
  const id: ast.Identifier = {
    loc: state.curr.token.loc,
    type: "Identifier", // TODO update the compiler etc. to support Word instead of overloading Identifier
    value: state.curr.token.src
  };
  advance(state);
  return id;
}

function chompIdentifierMaybe(state: State): ast.Identifier | null {
  if (
    state.curr.token.type !== "SYMBOL" ||
    ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)
  ) {
    return null;
  }
  const id: ast.Identifier = {
    loc: state.curr.token.loc,
    type: "Identifier",
    value: state.curr.token.src
  };
  advance(state);
  return id;
}

function chompIdentifier(state: State): ast.Identifier {
  const id = chompIdentifierMaybe(state);
  if (!id) {
    throw new ParseError("Expected Identifier", state.curr.token);
  }
  return id;
}

function chompDomainIdentifier(state: State): ast.DomainIdentifier {
  let domain = chompIdentifier(state);
  chomp(state, "RAW", ":");
  let value = chompIdentifier(state);
  return {
    loc: { start: domain.loc.start, end: value.loc.end },
    type: "DomainIdentifier",
    domain: domain.value,
    value: value.value
  };
}

function chompIdentifier_or_DomainIdentifier(
  state: State
): ast.Identifier | ast.DomainIdentifier {
  let domain = chompIdentifier(state);
  if (!chompMaybe(state, "RAW", ":")) {
    return domain;
  }
  let value = chompIdentifier(state);

  return {
    loc: { start: domain.loc.start, end: value.loc.end },
    type: "DomainIdentifier",
    domain: domain.value,
    value: value.value
  };
}

function identifierList(state: State): ast.Identifier[] {
  const ids: ast.Identifier[] = [];

  while (true) {
    const id = chompIdentifier(state);
    ids.push(id);
    if (!chompMaybe(state, "RAW", ",")) {
      break;
    }
  }

  return ids;
}

function declarationList(state: State): ast.Declaration[] {
  const declarations: ast.Declaration[] = [];

  while (state.curr.token_i < state.tokens.length) {
    if (
      state.curr.token.type !== "SYMBOL" ||
      ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)
    ) {
      break;
    }
    const next = lookahead(state, 2)[1];
    if (!next || next.type !== "RAW" || next.src !== "=") {
      break;
    }
    declarations.push(declaration(state));

    chompMaybe(state, "RAW", ";");
  }

  return declarations;
}

function declaration(state: State): ast.Declaration {
  const leftToken = state.curr.token;
  const left = chompIdentifierMaybe(state);
  if (!left) {
    throw new ParseError("Expected a declaration", state.curr.token);
  }
  if (!chompMaybe(state, "RAW", "=")) {
    throw new ParseError("Expected a declaration", leftToken);
  }
  const right = expression(state);

  return {
    loc: { start: left.loc.start, end: right.loc.end },
    type: "Declaration",
    op: "=",
    left,
    right
  };
}

function parameters(state: State): ast.Parameters {
  const start = state.curr.token.loc.start;
  const params: ast.Parameter[] = [];
  chomp(state, "RAW", "(");
  while (state.curr.token_i < state.tokens.length) {
    if (state.curr.token.type === "RAW" && state.curr.token.src === ")") {
      break;
    }
    params.push(parameter(state));

    if (chompMaybe(state, "RAW", ",")) {
      continue;
    } else {
      break;
    }
  }
  const end = state.curr.token.loc.end;
  chomp(state, "RAW", ")");

  return {
    loc: { start, end },
    type: "Parameters",
    params
  };
}

function parameter(state: State): ast.Parameter {
  const id = chompIdentifier(state);
  let dflt: ast.Expression | null = null;
  if (chompMaybe(state, "RAW", "=")) {
    dflt = expression(state);
  }
  return {
    loc: id.loc,
    type: "Parameter",
    id,
    default: dflt
  };
}

function chompArguments(state: State): ast.Arguments {
  const start = state.curr.token.loc.start;
  chomp(state, "RAW", "(");
  return chompArgumentsBase(state, start);
}

function chompArgumentsBase(state: State, start: number): ast.Arguments {
  const args: (ast.Expression | ast.NamedArgument)[] = [];

  while (state.curr.token_i < state.tokens.length) {
    if (state.curr.token.type === "RAW" && state.curr.token.src === ")") {
      break;
    }

    let arg = expression(state);

    if (
      arg.type === "Identifier" &&
      state.curr.token.type === "RAW" &&
      state.curr.token.src === "="
    ) {
      chomp(state, "RAW", "=");
      const end = state.curr.token.loc.end;
      const value = expression(state);
      args.push({
        loc: { start: arg.loc.start, end },
        type: "NamedArgument",
        id: arg as ast.Identifier,
        value
      });
    } else {
      args.push(arg);
    }

    if (!chompMaybe(state, "RAW", ",")) {
      break;
    }
  }

  const end = state.curr.token.loc.end;
  chomp(state, "RAW", ")");
  return {
    loc: { start, end },
    type: "Arguments",
    args
  };
}

///////////////////////////////////////////////////////////////////////////////
// Expressions

function expression(
  state: State,
  rbp: number = 0,
  errorMessage: string = "Expected an expression"
): ast.Expression {
  let prev = state.curr;
  if (!prev.rule.nud) {
    throw new ParseError(errorMessage, prev.token);
  }
  state = advance(state);
  let left = prev.rule.nud(state, prev.token);

  while (rbp < state.curr.rule.lbp) {
    prev = state.curr;
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

function defInfix(op: string, bp: number) {
  defRule(op, {
    lbp: bp,
    led(state, token, left) {
      var right = expression(state, bp);

      return {
        loc: token.loc,
        type: "InfixOperator",
        op,
        left,
        right
      };
    }
  });
}

function defPrefix(op: string, rbp: number) {
  defRule(op, {
    nud(state, token) {
      const loc = token.loc;
      const op = token.src;
      const arg = expression(state, rbp);

      return { loc, type: "UnaryOperator", op, arg };
    }
  });
}

defRule(".", {
  lbp: 80,
  led(state, token, left): ast.MemberExpression {
    const property = chompIdentifier_or_DomainIdentifier(state);
    return {
      loc: { start: left.loc.start, end: property.loc.end },
      type: "MemberExpression",
      object: left,
      method: "dot",
      property
    };
  }
});

defRule("{", {
  nud(state, token) {
    const { start } = token.loc;

    const value: ast.MapKeyValuePair[] = [];
    while (state.curr.rule.id !== "}") {
      const key = chompString(state);
      chomp(state, "RAW", ":");
      const val = expression(state);
      value.push({
        loc: { start: key.loc.start, end: val.loc.end },
        type: "MapKeyValuePair",
        key,
        value: val
      });
      if (state.curr.rule.id !== ",") {
        break;
      }
      advance(state);
    }

    const { end } = state.curr.token.loc;
    chomp(state, "RAW", "}");

    return {
      loc: { start, end },
      type: "Map",
      value
    };
  },

  lbp: 80,
  led(state, token, left) {
    const property = expression(state, 0);
    const end = state.curr.token.loc.end;
    chomp(state, "RAW", "}");
    return {
      loc: { start: left.loc.start, end },
      type: "MemberExpression",
      object: left,
      method: "path",
      property
    };
  }
});

defRule("(", {
  nud(state, token) {
    const e = expression(state, 0);
    chomp(state, "RAW", ")");
    return e;
  },

  lbp: 90,
  led(state, token, left) {
    const args = chompArgumentsBase(state, token.loc.start);
    return {
      loc: { start: left.loc.start, end: args.loc.end },
      type: "Application",
      callee: left,
      args
    };
  }
});

defRule("[", {
  nud(state, token) {
    const { start } = token.loc;

    const value: ast.Expression[] = [];
    while (state.curr.rule.id !== "]") {
      const val = expression(state);
      value.push(val);
      if (state.curr.rule.id !== ",") {
        break;
      }
      advance(state);
    }

    const { end } = state.curr.token.loc;
    chomp(state, "RAW", "]");

    return {
      loc: { start, end },
      type: "Array",
      value
    };
  },

  lbp: 80,
  led(state, token, left) {
    const property = expression(state, 0);
    const end = state.curr.token.loc.end;
    chomp(state, "RAW", "]");
    return {
      loc: { start: left.loc.start, end },
      type: "MemberExpression",
      object: left,
      method: "index",
      property
    };
  }
});

defRule("=>", {
  lbp: 10,
  led(state, token, left) {
    const consequent = expression(state, 10);
    chomp(state, "RAW", "|");
    const alternate = expression(state, 0);
    return {
      loc: { start: left.loc.start, end: alternate.loc.end },
      type: "ConditionalExpression",
      test: left,
      consequent,
      alternate
    };
  }
});

defInfix("||", 20);

defInfix("&&", 30);

defInfix("==", 40);
defInfix("!=", 40);
defInfix("<", 40);
defInfix("<=", 40);
defInfix(">", 40);
defInfix(">=", 40);
defInfix("like", 40);
defInfix("><", 40);
defInfix("<=>", 40);
defInfix("cmp", 40);

defInfix("+", 50);
defInfix("-", 50);

defInfix("*", 60);
defInfix("/", 60);
defInfix("%", 60);

defPrefix("+", 70);
defPrefix("-", 70);
defPrefix("not", 70);

defRule("function", {
  nud(state, token) {
    const loc = token.loc;

    const params = parameters(state);

    chomp(state, "RAW", "{");
    const body = declarationList(state);

    chompMaybe(state, "SYMBOL", "return");

    const returnExpr = expression(
      state,
      0,
      "Expected the function return expression"
    );
    chompMaybe(state, "RAW", ";");
    chomp(state, "RAW", "}");

    return {
      loc,
      type: "Function",
      params,
      body,
      return: returnExpr
    };
  }
});

defRule("defaction", {
  nud(state, token): ast.DefAction {
    const loc = token.loc;

    const params = parameters(state);

    chomp(state, "RAW", "{");

    const body = declarationList(state);

    const action_block = actionBlock(state);

    let returns: ast.Expression[] = [];

    if (
      chompMaybe(state, "SYMBOL", "return") ||
      chompMaybe(state, "SYMBOL", "returns")
    ) {
      while (state.curr.token_i < state.tokens.length) {
        if (state.curr.token.type === "RAW" && state.curr.token.src === "}") {
          break;
        }
        if (chompMaybe(state, "RAW", ";")) {
          break;
        }
        const val = expression(state);
        returns.push(val);
        if (state.curr.rule.id !== ",") {
          break;
        }
        advance(state);
      }
      chompMaybe(state, "RAW", ";");
    }

    chomp(state, "RAW", "}");

    return {
      loc,
      type: "DefAction",
      params,
      body,
      action_block,
      returns
    };
  }
});

defRule("true", {
  nud(state, token) {
    return { loc: token.loc, type: "Boolean", value: true };
  }
});

defRule("false", {
  nud(state, token) {
    return { loc: token.loc, type: "Boolean", value: false };
  }
});

defRule("null", {
  nud(state, token) {
    return { loc: token.loc, type: "Null" };
  }
});

defRule("SYMBOL", {
  nud(state, token) {
    if (ast.RESERVED_WORDS_ENUM.hasOwnProperty(token.src)) {
      throw new ParseError("Reserved word", token);
    }
    if (chompMaybe(state, "RAW", ":")) {
      const value = chompIdentifier(state);
      return {
        loc: { start: token.loc.start, end: value.loc.end },
        type: "DomainIdentifier",
        domain: token.src,
        value: value.value
      };
    }
    return {
      loc: token.loc,
      type: "Identifier",
      value: token.src
    };
  }
});

defRule("NUMBER", {
  nud(state, token) {
    return {
      loc: token.loc,
      type: "Number",
      value: parseFloat(token.src) || 0
    };
  }
});

defRule("STRING", {
  nud(state, token) {
    return {
      loc: token.loc,
      type: "String",
      value: token.src
        .replace(/(^")|("$)/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
    };
  }
});

defRule("CHEVRON-OPEN", {
  nud(state, token) {
    const start = token.loc.start;

    const value: ast.Expression[] = [];

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
    chomp(state, "CHEVRON-CLOSE", ">>");

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
  nud(state, token) {
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
// Rulesets
function rulesetID(state: State): ast.RulesetID {
  if (state.curr.token.type !== "SYMBOL") {
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

  let global: ast.Declaration[] = [];
  if (chompMaybe(state, "SYMBOL", "global")) {
    chomp(state, "RAW", "{");
    global = declarationList(state);
    if (!chompMaybe(state, "RAW", "}")) {
      throw new ParseError("Expected a declaration", state.curr.token);
    }
  }

  const rules: ast.Rule[] = [];
  let rule: ast.Rule | null = null;
  while ((rule = rulesetRule(state))) {
    rules.push(rule);
  }

  const end = state.curr.token.loc.end;
  chomp(state, "RAW", "}");

  return {
    loc: { start, end },
    type: "Ruleset",
    rid,
    meta,
    global,
    rules
  };
}

function rulesetMeta(state: State): ast.RulesetMeta | null {
  const start = state.curr.token.loc.start;
  if (!chompMaybe(state, "SYMBOL", "meta")) {
    return null;
  }
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

  const keyToken = state.curr.token;
  const key: ast.Keyword = {
    loc: state.curr.token.loc,
    type: "Keyword",
    value: state.curr.token.src
  };
  state = advance(state);

  let value: any = null;

  switch (key.value) {
    case "name":
    case "description":
    case "author":
      value = expression(state);
      break;

    case "logging":
      if (
        state.curr.token.type === "SYMBOL" &&
        (state.curr.token.src === "on" || state.curr.token.src === "off")
      ) {
        value = {
          loc: state.curr.token.loc,
          type: "Boolean",
          value: state.curr.token.src === "on"
        };
        state = advance(state);
      } else {
        throw new ParseError("Expected `on` or `off`", state.curr.token);
      }
      break;

    case "key":
    case "keys":
      key.value = "keys";

      if (state.curr.token.type !== "SYMBOL") {
        throw new ParseError("Expected key name", state.curr.token);
      }
      value = [
        {
          loc: state.curr.token.loc,
          type: "Keyword",
          value: state.curr.token.src
        }
      ];
      state = advance(state);
      value.push(expression(state));
      break;

    case "use":
      {
        chomp(state, "SYMBOL", "module");

        const rid = rulesetID(state);
        let version = null;
        if (chompMaybe(state, "SYMBOL", "version")) {
          version = chompString(state);
        }
        let alias = null;
        if (chompMaybe(state, "SYMBOL", "alias")) {
          alias = chompIdentifier(state);
        }
        let withExpr = null;
        if (chompMaybe(state, "SYMBOL", "with")) {
          withExpr = withExprBody(state);
        }
        value = {
          kind: "module",
          rid,
          version,
          alias,
          with: withExpr
        };
      }
      break;

    case "errors":
      {
        chomp(state, "SYMBOL", "to");
        const rid = rulesetID(state);
        let version = null;
        if (chompMaybe(state, "SYMBOL", "version")) {
          version = chompString(state);
        }
        value = { rid, version };
      }
      break;

    case "configure":
      {
        chomp(state, "SYMBOL", "using");
        const declarations = declarationList(state);
        value = { declarations };
      }
      break;

    case "provide":
    case "provides":
      key.value = "provides";
      {
        if (chompMaybe(state, "SYMBOL", "keys")) {
          const operator: ast.Keyword = {
            loc: state.curr.token.loc,
            type: "Keyword",
            value: "keys"
          };
          const ids = identifierList(state);
          chomp(state, "SYMBOL", "to");
          const rulesets = rulesetIDList(state);
          value = { operator, ids, rulesets };
        } else {
          const ids = identifierList(state);
          value = { ids };
        }
      }
      break;

    case "share":
    case "shares":
      key.value = "shares";
      value = { ids: identifierList(state) };
      break;

    default:
      throw new ParseError(`Unsupported meta key: ${key.value}`, keyToken);
  }

  if (!value) {
    return null;
  }
  return {
    loc: key.loc,
    type: "RulesetMetaProperty",
    key,
    value
  };
}

function withExprBody(state: State): ast.Declaration[] {
  const declarations: ast.Declaration[] = [];

  let sawAnAnd = false;
  while (true) {
    if (!sawAnAnd) {
      if (
        state.curr.token.type !== "SYMBOL" ||
        ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)
      ) {
        break;
      }
      const next = lookahead(state, 2)[1];
      if (!next || next.type !== "RAW" || next.src !== "=") {
        break;
      }
    }

    declarations.push(declaration(state));

    sawAnAnd = chompMaybe(state, "SYMBOL", "and");
  }

  if (declarations.length === 0) {
    throw new ParseError(
      "Expected declarations after `with`",
      state.curr.token
    );
  }

  return declarations;
}

function rulesetIDList(state: State): ast.RulesetID[] {
  const rids: ast.RulesetID[] = [];

  while (true) {
    const rid = rulesetID(state);
    rids.push(rid);
    if (!chompMaybe(state, "RAW", ",")) {
      break;
    }
  }

  return rids;
}

function rulesetRule(state: State): ast.Rule | null {
  const start = state.curr.token.loc.start;
  if (!chompMaybe(state, "SYMBOL", "rule")) {
    return null;
  }

  const name = chompIdentifier(state);

  let rule_state: "active" | "inactive" = "active";

  if (chompMaybe(state, "SYMBOL", "is")) {
    if (
      state.curr.token.type === "SYMBOL" &&
      (state.curr.token.src === "active" || state.curr.token.src === "inactive")
    ) {
      rule_state = state.curr.token.src;
      advance(state);
    } else {
      throw new ParseError("Expected active and inactive", state.curr.token);
    }
  }

  chomp(state, "RAW", "{");

  const selectStart = state.curr.token.loc.start;
  let select: ast.RuleSelect | null = null;
  if (chompMaybe(state, "SYMBOL", "select")) {
    chomp(state, "SYMBOL", "when");
    const event = eventExpression(state);

    const withinStart = state.curr.token.loc.start;
    let within: ast.EventWithin | null = null;
    if (chompMaybe(state, "SYMBOL", "within")) {
      const expr = expression(state);

      if (
        state.curr.token.type !== "SYMBOL" ||
        !ast.TIME_PERIOD_ENUM.hasOwnProperty(state.curr.token.src)
      ) {
        throw new ParseError(
          `Expected time period: [${Object.keys(ast.TIME_PERIOD_ENUM).join(
            ","
          )}]`,
          state.curr.token
        );
      }
      const time_period = state.curr.token
        .src as keyof typeof ast.TIME_PERIOD_ENUM;
      const end = state.curr.token.loc.end;
      advance(state);

      within = {
        loc: { start: withinStart, end },
        type: "EventWithin",
        expression: expr,
        time_period
      };
    }

    select = {
      loc: { start: selectStart, end: state.curr.token.loc.end },
      type: "RuleSelect",
      kind: "when",
      event,
      within
    };
  }

  const foreach: ast.RuleForEach[] = [];
  while (true) {
    const start = state.curr.token.loc.start;
    if (!chompMaybe(state, "SYMBOL", "foreach")) {
      break;
    }

    const expr = expression(state);

    chomp(state, "SYMBOL", "setting");
    chomp(state, "RAW", "(");

    const setting = identifierList(state);
    const end = state.curr.token.loc.end;
    chomp(state, "RAW", ")");

    foreach.push({
      loc: { start, end },
      type: "RuleForEach",
      expression: expr,
      setting
    });
  }

  let prelude: ast.Declaration[] = [];
  if (chompMaybe(state, "SYMBOL", "pre")) {
    chomp(state, "RAW", "{");
    prelude = declarationList(state);
    if (!chompMaybe(state, "RAW", "}")) {
      throw new ParseError("Expected a declaration", state.curr.token);
    }
  }

  let action_block: ast.ActionBlock | null = null;

  if (state.curr.token.type === "SYMBOL") {
    switch (state.curr.token.src) {
      case "fired":
      case "notfired":
      case "else":
      case "finally":
      case "always":
        break; // postlude
      default:
        action_block = actionBlock(state);
        break;
    }
  }

  let postlude = rulePostlude(state);

  const end = state.curr.token.loc.end;
  chomp(state, "RAW", "}");

  return {
    loc: { start, end },
    type: "Rule",
    name,
    rule_state,
    select,
    foreach,
    prelude,
    action_block,
    postlude
  };
}

function actionBlock(state: State): ast.ActionBlock {
  let { start, end } = state.curr.token.loc;

  let condition: ast.Expression | null = null;
  if (chompMaybe(state, "SYMBOL", "if")) {
    condition = expression(state);
    chomp(state, "SYMBOL", "then");
  }

  let block_type: "every" | "sample" | "choose" = "every";
  let discriminant: ast.Expression | null = null;
  let actions: ast.Action[] = [];

  if (state.curr.token.type === "SYMBOL") {
    switch (state.curr.token.src) {
      case "every":
      case "sample":
        block_type = state.curr.token.src;
        advance(state);
        actions = actionList(state);
        break;
      case "choose":
        block_type = state.curr.token.src;
        advance(state);
        discriminant = expression(state, 80);
        actions = actionList(state);
        break;

      case "always":
      case "fired":
      case "notfired":
        break; // postlude

      default:
        actions.push(action(state));
        break;
    }
  }

  if (condition && actions.length === 0) {
    if (state.curr.token.type === "RAW" && state.curr.token.src === "{") {
      throw new ParseError(
        "Expected `every`, `sample`, or `choose`",
        state.curr.token
      );
    }
    throw new ParseError(
      "Expected an action after `if ... then`",
      state.curr.token
    );
  }

  return {
    loc: { start, end },
    type: "ActionBlock",
    condition,
    block_type,
    discriminant,
    actions
  };
}

function actionList(state: State): ast.Action[] {
  let actions: ast.Action[] = [];

  chomp(state, "RAW", "{");
  while (state.curr.token_i < state.tokens.length) {
    if (state.curr.token.type === "RAW" && state.curr.token.src === "}") {
      break;
    }
    actions.push(action(state));
  }
  chomp(state, "RAW", "}");

  return actions;
}

function action(state: State): ast.Action {
  let { start, end } = state.curr.token.loc;

  let label: ast.Identifier | null = null;
  let action = chompIdentifier_or_DomainIdentifier(state);
  if (action.type === "Identifier" && chompMaybe(state, "RAW", "=>")) {
    label = action;
    action = chompIdentifier_or_DomainIdentifier(state);
  }

  const args = chompArguments(state);
  end = args.loc.end;

  let setting: ast.Identifier[] = [];
  if (chompMaybe(state, "SYMBOL", "setting")) {
    chomp(state, "RAW", "(");
    setting = identifierList(state);
    end = state.curr.token.loc.end;
    chomp(state, "RAW", ")");
  }

  chompMaybe(state, "RAW", ";");

  return {
    loc: { start, end },
    type: "Action",
    label,
    action,
    args,
    setting
  };
}

function rulePostlude(state: State): ast.RulePostlude | null {
  let { start, end } = state.curr.token.loc;

  let fired: ast.PostludeStatement[] | null = null;
  let notfired: ast.PostludeStatement[] | null = null;
  let always: ast.PostludeStatement[] | null = null;

  if (chompMaybe(state, "SYMBOL", "always")) {
    always = getPostludeStmts();
  } else if (chompMaybe(state, "SYMBOL", "fired")) {
    fired = getPostludeStmts();
    if (chompMaybe(state, "SYMBOL", "else")) {
      notfired = getPostludeStmts();
    }
    if (chompMaybe(state, "SYMBOL", "finally")) {
      always = getPostludeStmts();
    }
  } else if (chompMaybe(state, "SYMBOL", "notfired")) {
    notfired = getPostludeStmts();
    if (chompMaybe(state, "SYMBOL", "else")) {
      fired = getPostludeStmts();
    }
    if (chompMaybe(state, "SYMBOL", "finally")) {
      always = getPostludeStmts();
    }
  }

  if (fired === null && notfired === null && always === null) {
    return null;
  }

  return {
    loc: { start, end },
    type: "RulePostlude",
    fired,
    notfired,
    always
  };

  function getPostludeStmts() {
    const ret = postludeStatements(state);
    end = ret.end;
    return ret.stmts;
  }
}

function postludeStatements(
  state: State
): { stmts: ast.PostludeStatement[]; end: number } {
  const stmts: ast.PostludeStatement[] = [];

  chomp(state, "RAW", "{");
  while (state.curr.token_i < state.tokens.length) {
    if (state.curr.token.type === "RAW" && state.curr.token.src === "}") {
      break;
    }
    stmts.push(postludeStatement(state));

    chompMaybe(state, "RAW", ";");
  }

  const end = state.curr.token.loc.end;
  chomp(state, "RAW", "}");

  return { stmts, end };
}

function postludeStatement(state: State): ast.PostludeStatement {
  const stmt = postludeStatementCore(state);

  const [on, final] = lookahead(state, 2);
  if (
    on.type === "SYMBOL" &&
    on.src === "on" &&
    final.type === "SYMBOL" &&
    final.src === "final"
  ) {
    chomp(state, "SYMBOL", "on");
    const end = state.curr.token.loc.end;
    chomp(state, "SYMBOL", "final");
    return {
      loc: { start: stmt.loc.start, end },
      type: "GuardCondition",
      condition: "on final",
      statement: stmt
    };
  }

  if (chompMaybe(state, "SYMBOL", "if")) {
    const condition = expression(state);
    return {
      loc: { start: stmt.loc.start, end: condition.loc.end },
      type: "GuardCondition",
      condition,
      statement: stmt
    };
  }

  return stmt;
}

function postludeStatementCore(state: State): ast.PostludeStatement {
  if (state.curr.token.type === "SYMBOL") {
    switch (state.curr.token.src) {
      case "clear": {
        advance(state);
        const pvar = chompDomainIdentifier(state);
        const path = pathExpression(state);
        return {
          loc: pvar.loc,
          type: "ClearPersistentVariable",
          variable: pvar,
          path_expression: path
        };
      }

      case "raise": {
        const loc = state.curr.token.loc;
        state = advance(state);

        let event_domain: ast.Identifier | undefined;
        let event_type: ast.Expression | undefined;
        let event_domainAndType: ast.Expression | undefined;

        if (chompMaybe(state, "SYMBOL", "event")) {
          event_domainAndType = expression(state);
        } else {
          let id = chompIdentifierMaybe(state);
          if (!id) {
            throw new ParseError("Expected `event`", state.curr.token);
          }
          event_domain = id;
          chomp(state, "SYMBOL", "event");
          event_type = expression(state);
        }

        let for_rid: ast.Expression | null = null;
        if (chompMaybe(state, "SYMBOL", "for")) {
          for_rid = expression(state);
        }

        let event_attrs: ast.Expression | null = null;
        if (chompMaybe(state, "SYMBOL", "attributes")) {
          event_attrs = expression(state);
        }

        const node: ast.RaiseEventStatement = {
          loc,
          type: "RaiseEventStatement",
          event_attrs,
          for_rid
        };

        if (event_domainAndType) {
          node.event_domainAndType = event_domainAndType;
        } else {
          node.event_type = event_type;
          node.event_domain = event_domain;
        }
        return node;
      }

      case "schedule": {
        const loc = state.curr.token.loc;
        state = advance(state);

        let event_domain: ast.Identifier | undefined;
        let event_type: ast.Expression | undefined;
        let event_domainAndType: ast.Expression | undefined;
        let event_attrs: ast.Expression | null = null;
        let at: ast.Expression | undefined;
        let timespec: ast.Expression | undefined;
        let setting: ast.Identifier | null = null;

        if (chompMaybe(state, "SYMBOL", "event")) {
          event_domainAndType = expression(state);
        } else {
          event_domain = chompIdentifier(state);
          chomp(state, "SYMBOL", "event");
          event_type = expression(state);
        }

        if (
          state.curr.token.type === "SYMBOL" &&
          state.curr.token.src === "at"
        ) {
          advance(state);
          at = expression(state);
        } else if (
          state.curr.token.type === "SYMBOL" &&
          state.curr.token.src === "repeat"
        ) {
          advance(state);
          timespec = expression(state);
        } else {
          throw new ParseError("Expected `at` or `repeat`", state.curr.token);
        }

        if (chompMaybe(state, "SYMBOL", "attributes")) {
          event_attrs = expression(state);
        }

        if (chompMaybe(state, "SYMBOL", "setting")) {
          chomp(state, "RAW", "(");
          setting = chompIdentifier(state);
          chomp(state, "RAW", ")");
        }

        const node: ast.ScheduleEventStatement = {
          loc,
          type: "ScheduleEventStatement",
          event_attrs,
          setting
        };

        if (event_domainAndType) {
          node.event_domainAndType = event_domainAndType;
        } else {
          node.event_type = event_type;
          node.event_domain = event_domain;
        }
        if (at) node.at = at;
        if (timespec) node.timespec = timespec;
        return node;
      }

      case "log": {
        const loc = state.curr.token.loc;
        advance(state);
        const level = logOrErrorLevel(state);
        const expr = expression(state);
        return {
          loc,
          type: "LogStatement",
          level,
          expression: expr
        };
      }

      case "error": {
        const loc = state.curr.token.loc;
        advance(state);
        const level = logOrErrorLevel(state);
        const expr = expression(state);
        return {
          loc,
          type: "ErrorStatement",
          level,
          expression: expr
        };
      }

      case "last": {
        const loc = state.curr.token.loc;
        advance(state);
        return { loc, type: "LastStatement" };
      }
    }
  }

  if (easyLookahead(state, 3) === "SYMBOL:SYMBOL") {
    const left = chompDomainIdentifier(state);
    const path_expression = pathExpression(state);
    const loc = state.curr.token.loc;
    chomp(state, "RAW", ":=");
    const right = expression(state);

    return {
      loc,
      type: "PersistentVariableAssignment",
      op: ":=",
      left,
      path_expression,
      right
    };
  }

  return declaration(state);
}

function logOrErrorLevel(state: State): keyof typeof ast.LEVEL_ENUM {
  if (
    state.curr.token.type === "SYMBOL" &&
    ast.LEVEL_ENUM.hasOwnProperty(state.curr.token.src)
  ) {
    const level = state.curr.token.src as any;
    advance(state);
    return level;
  }
  throw new ParseError(
    "Expected " + Object.keys(ast.LEVEL_ENUM).join(" or "),
    state.curr.token
  );
}

function pathExpression(state: State): ast.Expression | null {
  if (!chompMaybe(state, "RAW", "{")) return null;
  const expr = expression(state);
  chomp(state, "RAW", "}");
  return expr;
}

///////////////////////////////////////////////////////////////////////////////
// Event Expression

function eventExpression(state: State, rbp: number = 0): ast.EventExpression {
  let prev = state.curr;
  if (!prev.rule.event_nud) {
    throw new ParseError("Expected an event expression", prev.token);
  }
  state = advance(state);
  let left = prev.rule.event_nud(state, prev.token);

  while (rbp < state.curr.rule.event_lbp) {
    prev = state.curr;
    advance(state);
    if (!prev.rule.event_led) {
      throw new ParseError(
        "Rule does not have a .event_led " + prev.rule.id,
        prev.token
      );
    }
    left = prev.rule.event_led(state, prev.token, left);
  }
  return left;
}

function attributeMatches(state: State): ast.AttributeMatch[] {
  const matches: ast.AttributeMatch[] = [];

  let match: ast.AttributeMatch | null = null;
  while ((match = attributeMatch(state))) {
    matches.push(match);
  }

  return matches;
}

function attributeMatch(state: State): ast.AttributeMatch | null {
  const ahead = lookahead(state, 2);
  if (ahead[0].type !== "SYMBOL" || ahead[1].type !== "REGEXP") {
    return null;
  }
  const key = chompWord(state, "Attribute");
  const value = expression(state) as ast.KrlRegExp;

  return {
    loc: { start: key.loc.start, end: value.loc.end },
    type: "AttributeMatch",
    key,
    value
  };
}

function defInfixEventOperator(op: ast.EventOperator["op"], bp: number) {
  defRule(op, {
    event_lbp: bp,
    event_led(state, token, left): ast.EventOperator {
      const right = eventExpression(state, bp);
      return {
        loc: token.loc,
        type: "EventOperator",
        op,
        args: [left, right]
      };
    }
  });
}

function defVariableArityEventExpression(
  op: ast.EventOperator["op"],
  hasCount: boolean = false
) {
  defRule(op, {
    event_nud(state, token) {
      const args: (ast.EventExpression | ast.Number)[] = [];

      if (hasCount) {
        args.push(chompPositiveInteger(state));
      }

      chomp(state, "RAW", "(");
      while (true) {
        const arg = eventExpression(state);
        args.push(arg);
        if (!chompMaybe(state, "RAW", ",")) {
          break;
        }
      }
      chomp(state, "RAW", ")");

      return {
        loc: token.loc,
        type: "EventOperator",
        op,
        args
      };
    }
  });
}

function defAggregatorEventExpression(op: ast.EventGroupOperator["op"]) {
  defRule(op, {
    event_nud(state, token) {
      const num = chompPositiveInteger(state);

      chomp(state, "RAW", "(");
      const event = eventExpressionBase(
        state,
        chompWord(state, "a bare word for the event domain")
      );
      chomp(state, "RAW", ")");

      if (state.curr.token.type === "SYMBOL") {
        switch (state.curr.token.src) {
          case "max":
          case "min":
          case "sum":
          case "avg":
          case "push":
            event.aggregator = {
              loc: state.curr.token.loc,
              type: "EventAggregator",
              op: state.curr.token.src,
              args: []
            };
            advance(state);
            chomp(state, "RAW", "(");
            event.aggregator.args = identifierList(state);
            chomp(state, "RAW", ")");
            break;
        }
      }

      return {
        loc: token.loc,
        type: "EventGroupOperator",
        op,
        n: num,
        event
      };
    }
  });
}

function eventExpressionBase(
  state: State,
  event_domain: ast.Identifier
): ast.EventExpressionBase {
  const hadColon = chompMaybe(state, "RAW", ":");
  const event_type = chompWord(
    state,
    hadColon ? "a bare word for the event type" : "`:`"
  );
  const event_attrs = attributeMatches(state);
  let setting: ast.Identifier[] = [];
  let where: ast.Expression | null = null;
  let deprecated: string | null = null;

  if (chompMaybe(state, "SYMBOL", "where")) {
    // DEPRECATED, should happen after setting
    where = expression(state);
  }

  if (chompMaybe(state, "SYMBOL", "setting")) {
    if (event_attrs.length === 0) {
      deprecated = "What are you `setting`? There are no attribute matches";
    }
    if (where) {
      deprecated = "Move the `where` clause to be after the `setting`";
    }
    chomp(state, "RAW", "(");
    setting = identifierList(state);
    chomp(state, "RAW", ")");
  }

  if (!where && chompMaybe(state, "SYMBOL", "where")) {
    where = expression(state);
  }

  const node: ast.EventExpressionBase = {
    loc: { start: event_domain.loc.start, end: event_type.loc.end },
    type: "EventExpression",
    event_domain,
    event_type,
    event_attrs,
    setting,
    where,
    aggregator: null
  };

  if (deprecated) {
    node.deprecated = deprecated;
  }
  return node;
}

defRule("(", {
  event_nud(state, token) {
    const e = eventExpression(state, 0);
    chomp(state, "RAW", ")");
    return e;
  }
});

defInfixEventOperator("or", 20);

defInfixEventOperator("and", 30);

defInfixEventOperator("before", 40);
defInfixEventOperator("then", 40);
defInfixEventOperator("after", 40);

defRule("between", {
  event_lbp: 50,
  event_led(state, token, left): ast.EventOperator {
    chomp(state, "RAW", "(");
    const one = eventExpression(state);
    chomp(state, "RAW", ",");
    const two = eventExpression(state);
    chomp(state, "RAW", ")");
    return {
      loc: token.loc,
      type: "EventOperator",
      op: "between",
      args: [left, one, two]
    };
  }
});

defRule("not", {
  event_lbp: 50,
  event_led(state, token, left): ast.EventOperator {
    chomp(state, "SYMBOL", "between");
    chomp(state, "RAW", "(");
    const one = eventExpression(state);
    chomp(state, "RAW", ",");
    const two = eventExpression(state);
    chomp(state, "RAW", ")");
    return {
      loc: token.loc,
      type: "EventOperator",
      op: "not between",
      args: [left, one, two]
    };
  }
});

defVariableArityEventExpression("any", true);
defVariableArityEventExpression("and");
defVariableArityEventExpression("or");
defVariableArityEventExpression("before");
defVariableArityEventExpression("then");
defVariableArityEventExpression("after");
defAggregatorEventExpression("count");
defAggregatorEventExpression("repeat");

defRule("SYMBOL", {
  event_nud(state, token) {
    const event_domain: ast.Identifier = {
      loc: token.loc,
      type: "Identifier",
      value: token.src
    };
    return eventExpressionBase(state, event_domain);
  }
});

///////////////////////////////////////////////////////////////////////////////

defRule(",", {});
defRule(";", {});
defRule(":", {});
defRule(":=", {});
defRule("=", {});
defRule("|", {});
defRule("}", {});
defRule(")", {});
defRule("]", {});
defRule("(end)", {});

///////////////////////////////////////////////////////////////////////////////

function parseCore<OUT>(
  tokens: Token[],
  entryParse: (state: State) => OUT
): OUT {
  let state: State = {
    tokens: tokens,
    curr: advanceBase(rules, tokens, 0)
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

export function parse(
  tokens: Token[]
): ast.Ruleset | (ast.Declaration | ast.Expression)[] {
  return parseCore(tokens, state => {
    if (
      state.curr.token.type === "SYMBOL" &&
      state.curr.token.src === "ruleset"
    ) {
      return ruleset(state);
    }

    const statements: (ast.Declaration | ast.Expression)[] = [];
    while (state.curr.token_i < state.tokens.length) {
      if (state.curr.rule.id === "(end)") {
        break;
      }

      if (easyLookahead(state, 2) === "SYMBOL=") {
        statements.push(declaration(state));
      } else {
        statements.push(expression(state));
      }

      chompMaybe(state, "RAW", ";");
    }
    return statements;
  });
}

export function parseExpression(tokens: Token[]) {
  return parseCore(tokens, expression);
}

export function parseRuleset(tokens: Token[]) {
  return parseCore(tokens, ruleset);
}
