import { PicoEvent } from "./PicoEvent";
import { PicoQuery } from "./PicoQuery";
import { RulesetContext } from "./RulesetContext";

export interface Ruleset {
  rid: string;
  init(
    ctx: RulesetContext,
    environment: any
  ): Promise<RulesetInstance> | RulesetInstance;
}

export interface RulesetConfig {
  [name: string]: any;
}

export interface RulesetInstance {
  event?(event: PicoEvent, eid: string): Promise<void> | void;

  query?: {
    [name: string]: (query: PicoQuery, qid: string) => any;
  };
}
