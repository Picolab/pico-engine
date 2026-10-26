import { RulesetSchemaAttr } from "./RulesetSchema";

export interface PicoSchemaSource {
  rid: string;
  rule: string;
}

export interface PicoSchemaEvent {
  domain: string;
  name: string;
  attrs?: RulesetSchemaAttr[];
  description?: string;
  sources?: PicoSchemaSource[];
}

export interface PicoSchemaQuery {
  rid: string;
  name: string;
  description?: string;
}

export interface PicoSchemaConflict {
  domain: string;
  name: string;
  attr: string;
}

export interface PicoSchema {
  version?: number;
  events?: PicoSchemaEvent[];
  queries?: PicoSchemaQuery[];
  conflicts?: PicoSchemaConflict[];
}
