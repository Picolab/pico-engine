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

function defRule(id: string, rule: Partial<Omit<Rule, "id">>) {
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
  return state;
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

function chompIdentifier(state: State): ast.Identifier {
  if (
    state.curr.token.type !== "SYMBOL" &&
    ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)
  ) {
    throw new ParseError("Expected Identifier", state.curr.token);
  }
  const id: ast.Identifier = {
    loc: state.curr.token.loc,
    type: "Identifier",
    value: state.curr.token.src
  };
  advance(state);
  return id;
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
    domain,
    value
  };
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

  let global: ast.Declaration[] = [];
  if (chompMaybe(state, "SYMBOL", "global")) {
    chomp(state, "RAW", "{");
    global = declarationList(state);
    chomp(state, "RAW", "}");
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
        const declarations = withExprBody(state);
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

  while (true) {
    if (
      state.curr.token.type !== "SYMBOL" ||
      ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)
    ) {
      break;
    }
    declarations.push(declaration(state));

    chompMaybe(state, "SYMBOL", "and");
  }

  return declarations;
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

function declarationList(state: State): ast.Declaration[] {
  const declarations: ast.Declaration[] = [];

  while (true) {
    if (
      state.curr.token.type !== "SYMBOL" ||
      ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)
    ) {
      break;
    }
    declarations.push(declaration(state));
  }

  return declarations;
}

function declarationOrDefAction(state: State): ast.Declaration {
  // TODO also DefAction
  return declaration(state);
}

function declaration(state: State): ast.Declaration {
  const left = chompIdentifier(state);
  chomp(state, "RAW", "=");
  const right = expression(state);

  return {
    loc: { start: left.loc.start, end: right.loc.end },
    type: "Declaration",
    op: "=",
    left,
    right
  };
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
    chomp(state, "RAW", "}");
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

  let postlude: ast.RulePostlude | null = null;
  // TODO

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

function eventExpression(state: State): ast.EventExpression {
  const start = state.curr.token.loc.start;
  const event_domain = chompIdentifier(state);
  const event_type = chompIdentifier(state);

  return {
    loc: { start, end: 0 },
    type: "EventExpression",
    event_domain,
    event_type,
    event_attrs: [],
    where: null,
    setting: [],
    aggregator: null
  };
}

function actionBlock(state: State): ast.ActionBlock {
  let { start, end } = state.curr.token.loc;

  let condition: ast.Node | null = null;
  if (chompMaybe(state, "SYMBOL", "if")) {
    condition = expression(state);
    chomp(state, "SYMBOL", "then");
  }

  let block_type: "every" | "sample" | "choose" = "every";
  let discriminant: ast.Node | null = null;
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
        discriminant = expression(state);
        actions = actionList(state);
        break;
      default:
        actions.push(action(state));
        break;
    }
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

  return {
    loc: { start, end },
    type: "Action",
    label,
    action,
    args,
    setting
  };
}

function chompArguments(state: State): ast.Arguments {
  const start = state.curr.token.loc.start;
  chomp(state, "RAW", "(");
  return chompArgumentsBase(state, start);
}

function chompArgumentsBase(state: State, start: number): ast.Arguments {
  const args: ast.Node[] = [];

  while (state.curr.token_i < state.tokens.length) {
    if (state.curr.token.type === "RAW" && state.curr.token.src === ")") {
      break;
    }

    let arg: ast.Node | null = expression(state);

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
        id: arg,
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

function infix(op: string, bp: number) {
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

///////////////////////////////////////////////////////////////////////////////

defRule("(end)", {});
defRule(".", {});
defRule(",", {});
defRule("-", {});
defRule("{", {});
defRule("}", {});
defRule("(", {
  lbp: 80,
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
defRule(")", {});
defRule("=", {});
defRule("=>", {});

infix("==", 40);

defRule("[", {
  nud(state) {
    const { start } = state.curr.token.loc;
    advance(state);

    const value: ast.Node[] = [];
    while (state.curr.rule.id !== "]") {
      const val = expression(state);
      value.push(val);
      if (state.curr.rule.id !== ",") {
        break;
      }
      advance(state);
    }

    const { end } = state.curr.token.loc;
    if (state.curr.token.type !== "RAW" || state.curr.token.src !== "]") {
      throw new ParseError("Expected `]`", state.curr.token);
    }

    return {
      loc: { start, end },
      type: "Array",
      value
    };
  }
});
defRule("]", {});

defRule("true", {
  nud(state) {
    return { loc: state.curr.token.loc, type: "Boolean", value: true };
  }
});

defRule("false", {
  nud(state) {
    return { loc: state.curr.token.loc, type: "Boolean", value: false };
  }
});

defRule("SYMBOL", {
  nud(state) {
    if (ast.RESERVED_WORDS_ENUM.hasOwnProperty(state.curr.token.src)) {
      throw new ParseError("Reserved word", state.curr.token);
    }
    return {
      loc: state.curr.token.loc,
      type: "Identifier",
      value: state.curr.token.src
    };
  }
});

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
