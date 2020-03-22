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
  config: { [name: string]: any };
}
