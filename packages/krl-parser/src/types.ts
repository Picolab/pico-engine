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
  value: Node[];
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
  right: Node;
}

export interface ExpressionStatement extends BaseNode {
  type: "ExpressionStatement";
  expression: Node;
}

export type Statement = Declaration | ExpressionStatement;

export interface InfixOperator extends BaseNode {
  type: "InfixOperator";
  op: string;
  left: Node;
  right: Node;
}

export interface UnaryOperator extends BaseNode {
  type: "UnaryOperator";
  op: string;
  arg: Node;
}

interface ConditionalExpression extends BaseNode {
  type: "ConditionalExpression";
  test: Node;
  consequent: Node;
  alternate: Node;
}

export interface MemberExpression extends BaseNode {
  type: "MemberExpression";
  object: Node;
  method: "index" | "dot" | "path";
  property: Node;
}

export interface Function extends BaseNode {
  type: "Function";
  params: Parameters;
  body: Statement[];
}

export interface DefAction extends BaseNode {
  type: "DefAction";
  params: Parameters;
  body: Declaration[];
  action_block: ActionBlock;
  returns: Node[];
}

export interface Parameters extends BaseNode {
  type: "Parameters";
  params: Parameter[];
}

export interface Parameter extends BaseNode {
  type: "Parameter";
  id: Identifier;
  default: Node | null;
}

export interface Application extends BaseNode {
  type: "Application";
  callee: Node;
  args: Arguments;
}

export interface Array extends BaseNode {
  type: "Array";
  value: Node[];
}

export interface Map extends BaseNode {
  type: "Map";
  value: MapKeyValuePair[];
}

export interface MapKeyValuePair extends BaseNode {
  type: "MapKeyValuePair";
  key: String;
  value: Node;
}

export interface Arguments extends BaseNode {
  type: "Arguments";
  args: Node[];
}

export interface NamedArgument extends BaseNode {
  type: "NamedArgument";
  id: Identifier;
  value: Node;
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
  where: Node | null;
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
  expression: Node;
  time_period: keyof typeof TIME_PERIOD_ENUM;
}

export interface RuleForEach extends BaseNode {
  type: "RuleForEach";
  expression: Node;
  setting: Identifier[];
}

export interface ActionBlock extends BaseNode {
  type: "ActionBlock";
  condition: Node | null;
  block_type: "every" | "sample" | "choose";
  discriminant: Node | null;
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
  fired: Node[] | null;
  notfired: Node[] | null;
  always: Node[] | null;
}

export interface GuardCondition extends BaseNode {
  type: "GuardCondition";
  condition: "on final" | Node;
  statement: Node;
}

export interface PersistentVariableAssignment extends BaseNode {
  type: "PersistentVariableAssignment";
  op: ":=";
  left: DomainIdentifier;
  path_expression: Node | null;
  right: Node;
}

export interface ClearPersistentVariable extends BaseNode {
  type: "ClearPersistentVariable";
  variable: DomainIdentifier;
  path_expression: Node | null;
}

export interface RaiseEventStatement extends BaseNode {
  type: "RaiseEventStatement";
  event_domain?: Identifier;
  event_type?: Node;
  event_domainAndType?: Node;
  event_attrs: Node | null;
  for_rid: Node | null;
}

export interface ScheduleEventStatement extends BaseNode {
  type: "ScheduleEventStatement";
  event_domain?: Identifier;
  event_type?: Node;
  event_domainAndType?: Node;
  event_attrs: Node | null;
  setting: Identifier | null;
  at?: Node;
  timespec?: Node;
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
  expression: Node;
}

export interface ErrorStatement extends BaseNode {
  type: "ErrorStatement";
  level: keyof typeof LEVEL_ENUM;
  expression: Node;
}

export interface LastStatement extends BaseNode {
  type: "LastStatement";
}

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
  | ExpressionStatement
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
