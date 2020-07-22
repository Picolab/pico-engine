import {
  PicoEvent,
  PicoQuery,
  RulesetConfig,
  RulesetContext,
} from "pico-framework";
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

export interface RulesetCtxInfo {
  rid: string;
  version: string;
  config: RulesetConfig | null;
  url: string;
  meta: RulesetCtxInfoMeta | null;
}

export interface RulesetCtxInfoMeta {
  krl: string;
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}

interface ScheduledEvent_base {
  id: string;
  event: PicoEvent;
}

interface ScheduledEvent_at extends ScheduledEvent_base {
  type: "at";
  time: number;
}

interface ScheduledEvent_repeat extends ScheduledEvent_base {
  type: "repeat";
  timespec: string;
}

export type ScheduledEvent = ScheduledEvent_at | ScheduledEvent_repeat;

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

  // rsCtx extensions
  newPico(rulesets: { url: string; config: any }[]): Promise<string>;
  rulesets(): RulesetCtxInfo[];
  install(url: string, config: RulesetConfig): Promise<void>;
  uninstall(rid: string): Promise<void>;
  flush(url: string): Promise<void>;
  scheduleEvent(sEvent: ScheduledEvent): void;
  removeScheduledEvent(id: string): void;

  // compiler lib
  aggregateEvent(state: any, op: string, pairs: [string, string][]): any;
}
