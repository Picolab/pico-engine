import { PicoEvent, PicoQuery, RulesetContext } from "pico-framework";
import * as krl from "./krl";
import { KrlLogger } from "./KrlLogger";

export interface CurrentPicoEvent extends PicoEvent {
  eid: string;
}

export interface CurrentPicoQuery extends PicoQuery {
  qid: string;
}

export interface Directive {
  name: string;
  options: { [name: string]: any };
}

export interface PicoLogEntry {
  level: string;
  time: Date;
  txnId?: string;
}

export interface KrlCtx {
  rsCtx: RulesetContext;

  // logging
  log: KrlLogger;
  getPicoLogs(): Promise<PicoLogEntry[]>;

  // current event/query
  getEvent(): CurrentPicoEvent | null;
  setEvent(event: CurrentPicoEvent | null): void;
  getQuery(): CurrentPicoQuery | null;
  setQuery(query: CurrentPicoQuery | null): void;

  // modules
  module(domain: string): krl.Module | null;
  configure(name: string, dflt: any): any;
  useModule(
    rid: string,
    alias?: string | null,
    configure?: { [name: string]: any }
  ): Promise<void> | void;

  // directives
  addDirective(name: string, options: { [name: string]: any }): Directive;
  drainDirectives(): Directive[];

  // compiler lib
  krl: typeof krl;
}
