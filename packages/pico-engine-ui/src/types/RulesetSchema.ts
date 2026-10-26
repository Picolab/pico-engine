export interface RulesetSchemaAttr {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
  defaultExpr?: string;
}

export interface RulesetSchemaOperation {
  rule: string;
  description?: string;
  entry?: Array<{ domain?: string | null; name?: string | null }>;
  select?: string;
  condition?: string | null;
  attrs?: RulesetSchemaAttr[];
  examples?: Array<{ name: string; attrs: Record<string, unknown> }>;
  alsoSelectedBy?: Array<{ rule: string; select?: string; condition?: string | null }>;
  emits?: Array<Record<string, unknown>>;
  prechecks?: Array<Record<string, unknown>>;
}

export interface RulesetSchemaQuery {
  name: string;
  description?: string;
  args?: RulesetSchemaAttr[];
  returns?: string;
  examples?: Array<{ name: string; args: Record<string, unknown> }>;
}

export interface RulesetSchema {
  version: number;
  rid: string;
  rid_version?: string;
  description?: string;
  operations?: RulesetSchemaOperation[];
  queries?: RulesetSchemaQuery[];
}
