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
  type: "directive";
  name: string;
  options: { [name: string]: any };
  meta: {
    rid: string;
    rule_name: string | null;
    txnId: string | null;
  };
}

export type RuleOutcomeStatus = "fired" | "not_fired" | "not_selected";

/** Per annotated rule after an event (1.8 rule outcome reporting). */
export interface RuleOutcome {
  rid: string;
  rule: string;
  status: RuleOutcomeStatus;
  /** Present when status is not_selected (from ruleset schema). */
  select?: string;
}

export interface PicoLogEntry {
  level: string;
  time: string;
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
  setCurrentRuleName(ruleName: string | null): void;
  getCurrentRuleName(): string | null;
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

  /** Record selected rule finished (fired or condition false). */
  recordRuleOutcome(rule: string, fired: boolean): void;
  drainRuleOutcomes(): RuleOutcome[];

  // compiler lib
  krl: typeof krl;

  /** Engine-injected KRL console compiler (not available in KRL modules). */
  compileEvalExpression?: (
    expr: string,
    opts: { rulesetKrl: string }
  ) => {
    warnings: unknown[];
    run: ($ctx: KrlCtx, $g: Record<string, unknown>) => Promise<unknown>;
  };
}
