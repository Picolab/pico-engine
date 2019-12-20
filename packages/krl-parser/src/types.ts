export interface Loc {
  start: number;
  end: number;
}

export type TokenType =
  | "WHITESPACE"
  | "LINE-COMMENT"
  | "BLOCK-COMMENT"
  | "SYMBOL"
  | "NUMBER"
  | "STRING"
  | "REGEXP"
  | "CHEVRON-OPEN"
  | "CHEVRON-STRING"
  | "CHEVRON-BEESTING-OPEN"
  | "CHEVRON-BEESTING-CLOSE"
  | "CHEVRON-CLOSE"
  | "RAW"
  | "ILLEGAL"
  | "MISSING-CLOSE";

export interface Token {
  type: TokenType;
  src: string;
  loc: Loc;
  missingClose?: string;
}

interface BaseNode {
  type: string;
  loc: Loc;
}

export interface Number extends BaseNode {
  type: "Number";
  value: number;
}

export interface Boolean extends BaseNode {
  type: "Boolean";
  value: true | false;
}

export interface Null extends BaseNode {
  type: "Null";
}

export interface String extends BaseNode {
  type: "String";
  value: string;
}

export interface Chevron extends BaseNode {
  type: "Chevron";
  value: Expression[];
}

export interface Keyword extends BaseNode {
  type: "Keyword";
  value: string;
}

export interface KrlRegExp extends BaseNode {
  type: "RegExp";
  value: RegExp;
}

export const RESERVED_WORDS_ENUM = {
  defaction: true,
  function: true,
  return: true,
  not: true,
  setting: true,
  null: true,
  true: true,
  false: true
};

export interface Identifier extends BaseNode {
  type: "Identifier";
  value: string;
}

export interface DomainIdentifier extends BaseNode {
  type: "DomainIdentifier";
  value: string;
  domain: string;
}

export interface Declaration extends BaseNode {
  type: "Declaration";
  op: "=";
  left: Identifier;
  right: Expression;
}

export interface InfixOperator extends BaseNode {
  type: "InfixOperator";
  op: string;
  left: Expression;
  right: Expression;
}

export interface UnaryOperator extends BaseNode {
  type: "UnaryOperator";
  op: string;
  arg: Expression;
}

export interface ConditionalExpression extends BaseNode {
  type: "ConditionalExpression";
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface MemberExpression extends BaseNode {
  type: "MemberExpression";
  object: Expression;
  method: "index" | "dot" | "path";
  property: Expression;
}

export interface Function extends BaseNode {
  type: "Function";
  params: Parameters;
  body: Declaration[];
  return: Expression;
}

export interface DefAction extends BaseNode {
  type: "DefAction";
  params: Parameters;
  body: Declaration[];
  action_block: ActionBlock;
  returns: Expression[];
}

export interface Parameters extends BaseNode {
  type: "Parameters";
  params: Parameter[];
}

export interface Parameter extends BaseNode {
  type: "Parameter";
  id: Identifier;
  default: Expression | null;
}

export interface Application extends BaseNode {
  type: "Application";
  callee: Expression;
  args: Arguments;
}

export interface Array extends BaseNode {
  type: "Array";
  value: Expression[];
}

export interface Map extends BaseNode {
  type: "Map";
  value: MapKeyValuePair[];
}

export interface MapKeyValuePair extends BaseNode {
  type: "MapKeyValuePair";
  key: String;
  value: Expression;
}

export interface Arguments extends BaseNode {
  type: "Arguments";
  args: (NamedArgument | Expression)[];
}

export interface NamedArgument extends BaseNode {
  type: "NamedArgument";
  id: Identifier;
  value: Expression;
}

export interface RulesetID extends BaseNode {
  type: "RulesetID";
  value: string;
}

export interface Ruleset extends BaseNode {
  type: "Ruleset";
  rid: RulesetID;
  meta: RulesetMeta | null;
  global: Declaration[];
  rules: Rule[];
}

export interface RulesetMeta extends BaseNode {
  type: "RulesetMeta";
  properties: RulesetMetaProperty[];
}

export interface RulesetMetaProperty extends BaseNode {
  type: "RulesetMetaProperty";
  key: Keyword;
  value: any;
}

export interface Rule extends BaseNode {
  type: "Rule";
  name: Identifier;
  rule_state: "active" | "inactive";
  select: RuleSelect | null;
  foreach: RuleForEach[];
  prelude: Declaration[];
  action_block: ActionBlock | null;
  postlude: RulePostlude | null;
}

export interface RuleSelect extends BaseNode {
  type: "RuleSelect";
  kind: "when";
  event: EventExpression;
  within: EventWithin | null;
}

export type EventExpression =
  | EventExpressionBase
  | EventOperator
  | EventGroupOperator;

export interface EventExpressionBase extends BaseNode {
  type: "EventExpression";
  event_domain: Identifier;
  event_type: Identifier;
  event_attrs: AttributeMatch[];
  setting: Identifier[];
  where: Expression | null;
  aggregator: EventAggregator | null;
  deprecated?: string;
}

export interface AttributeMatch extends BaseNode {
  type: "AttributeMatch";
  key: Identifier;
  value: KrlRegExp;
}

export interface EventOperator extends BaseNode {
  type: "EventOperator";
  op:
    | "or"
    | "and"
    | "before"
    | "then"
    | "after"
    | "between"
    | "not between"
    | "any";
  args: (EventExpression | Number)[];
}

export interface EventGroupOperator extends BaseNode {
  type: "EventGroupOperator";
  op: "count" | "repeat";
  n: Number;
  event: EventExpression;
}

export interface EventAggregator extends BaseNode {
  type: "EventAggregator";
  op: "max" | "min" | "sum" | "avg" | "push";
  args: Identifier[];
}

export const TIME_PERIOD_ENUM = {
  day: true,
  days: true,
  hour: true,
  hours: true,
  minute: true,
  minutes: true,
  month: true,
  months: true,
  second: true,
  seconds: true,
  week: true,
  weeks: true,
  year: true,
  years: true
};

export interface EventWithin extends BaseNode {
  type: "EventWithin";
  expression: Expression;
  time_period: keyof typeof TIME_PERIOD_ENUM;
}

export interface RuleForEach extends BaseNode {
  type: "RuleForEach";
  expression: Expression;
  setting: Identifier[];
}

export interface ActionBlock extends BaseNode {
  type: "ActionBlock";
  condition: Expression | null;
  block_type: "every" | "sample" | "choose";
  discriminant: Expression | null;
  actions: Action[];
}

export interface Action extends BaseNode {
  type: "Action";
  label: Identifier | null;
  action: Identifier | DomainIdentifier;
  args: Arguments;
  setting: Identifier[];
}

export interface RulePostlude extends BaseNode {
  type: "RulePostlude";
  fired: PostludeStatement[] | null;
  notfired: PostludeStatement[] | null;
  always: PostludeStatement[] | null;
}

export interface GuardCondition extends BaseNode {
  type: "GuardCondition";
  condition: "on final" | Expression;
  statement: PostludeStatement;
}

export interface PersistentVariableAssignment extends BaseNode {
  type: "PersistentVariableAssignment";
  op: ":=";
  left: DomainIdentifier;
  path_expression: Expression | null;
  right: Expression;
}

export interface ClearPersistentVariable extends BaseNode {
  type: "ClearPersistentVariable";
  variable: DomainIdentifier;
  path_expression: Expression | null;
}

export interface RaiseEventStatement extends BaseNode {
  type: "RaiseEventStatement";
  event_domain?: Identifier;
  event_type?: Expression;
  event_domainAndType?: Expression;
  event_attrs: Expression | null;
  for_rid: Expression | null;
}

export interface ScheduleEventStatement extends BaseNode {
  type: "ScheduleEventStatement";
  event_domain?: Identifier;
  event_type?: Expression;
  event_domainAndType?: Expression;
  event_attrs: Expression | null;
  setting: Identifier | null;
  at?: Expression;
  timespec?: Expression;
}

export const LEVEL_ENUM = {
  error: true,
  warn: true,
  info: true,
  debug: true
};

export interface LogStatement extends BaseNode {
  type: "LogStatement";
  level: keyof typeof LEVEL_ENUM;
  expression: Expression;
}

export interface ErrorStatement extends BaseNode {
  type: "ErrorStatement";
  level: keyof typeof LEVEL_ENUM;
  expression: Expression;
}

export interface LastStatement extends BaseNode {
  type: "LastStatement";
}

export type PostludeStatement =
  | GuardCondition
  | PersistentVariableAssignment
  | ClearPersistentVariable
  | RaiseEventStatement
  | ScheduleEventStatement
  | LogStatement
  | ErrorStatement
  | LastStatement
  | Declaration;

export type Expression =
  | Number
  | Boolean
  | Null
  | String
  | Chevron
  | KrlRegExp
  | Identifier
  | DomainIdentifier
  | InfixOperator
  | UnaryOperator
  | ConditionalExpression
  | MemberExpression
  | Function
  | DefAction
  | Application
  | Array
  | Map;

export type Node =
  | Number
  | Boolean
  | Null
  | String
  | Chevron
  | Keyword
  | KrlRegExp
  | Identifier
  | DomainIdentifier
  | Declaration
  | InfixOperator
  | UnaryOperator
  | ConditionalExpression
  | MemberExpression
  | Function
  | DefAction
  | Parameters
  | Parameter
  | Application
  | Array
  | Map
  | MapKeyValuePair
  | Arguments
  | NamedArgument
  | Ruleset
  | RulesetID
  | RulesetMeta
  | RulesetMetaProperty
  | Rule
  | RuleSelect
  | EventExpressionBase
  | AttributeMatch
  | EventOperator
  | EventGroupOperator
  | EventAggregator
  | EventWithin
  | RuleForEach
  | ActionBlock
  | Action
  | RulePostlude
  | GuardCondition
  | PersistentVariableAssignment
  | ClearPersistentVariable
  | RaiseEventStatement
  | ScheduleEventStatement
  | LogStatement
  | ErrorStatement
  | LastStatement;
