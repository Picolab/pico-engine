import { Channel } from "./Channel";

export interface PicoDetails {
  parent: string | null;
  children: string[];
  channels: Channel[];
  rulesets: PicoRuleset[];
}

export interface PicoRuleset {
  rid: string;
  config: any;
  url: string;
  /** From ctx:rulesets — rulesets with @view functions only (1.8+). */
  viewCount?: number;
  meta: RulesetCtxInfoMeta | null;
}

interface RulesetCtxInfoMeta {
  krl: string;
  krlMeta?: {
    version?: string;
    name?: string;
    description?: string;
    author?: string;
  };
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}
