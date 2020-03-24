import { Channel } from "./Channel";

export interface PicoDetails {
  parent: string | null;
  children: string[];
  channels: Channel[];
  rulesets: PicoRuleset[];
}

export interface PicoRuleset {
  rid: string;
  version: string;
  config: any;
  url: string;
  meta: RulesetCtxInfoMeta | null;
}

interface RulesetCtxInfoMeta {
  krl: string;
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}
