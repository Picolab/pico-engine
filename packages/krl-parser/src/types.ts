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

export interface RulesetID extends BaseNode {
  type: "RulesetID";
  value: string;
}

export interface Ruleset extends BaseNode {
  type: "Ruleset";
  rid: RulesetID;
  meta: RulesetMeta | null;
  // global: [],
  // rules: []
}

export interface RulesetMeta extends BaseNode {
  type: "RulesetMeta";
  properties: RulesetMetaProperty[];
}

export interface RulesetMetaProperty extends BaseNode {
  type: "RulesetMetaProperty";
  key: Keyword;
  value: Node;
}

export type Node =
  | Number
  | String
  | Chevron
  | Keyword
  | KrlRegExp
  | Ruleset
  | RulesetID
  | RulesetMeta
  | RulesetMetaProperty;
