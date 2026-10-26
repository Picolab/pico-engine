import { Directive, RuleOutcome } from "krl-stdlib";
import type { PicoEvent } from "pico-framework";

export interface CoreEventOutput {
  eid: string;
  directives: Directive[];
  /** Events raised during the same transaction (excluding the ingress event). */
  events?: Array<{
    domain: string;
    name: string;
    data?: PicoEvent["data"];
    attrs?: PicoEvent["data"] extends { attrs?: infer A } ? A : unknown;
  }>;
  ruleOutcomes?: RuleOutcome[];
}

export function formatEventOutput(resp: {
  eid: string;
  responses: any[];
  ruleOutcomes?: RuleOutcome[];
  raisedEvents?: PicoEvent[];
}): CoreEventOutput {
  const directives: Directive[] = [];

  for (const response of resp.responses) {
    const parts = Array.isArray(response)
      ? response
      : response && Array.isArray(response.directives)
        ? response.directives
        : [];
    for (const part of parts) {
      if (part && part.type === "directive") {
        directives.push(part);
      }
    }
  }

  const out: CoreEventOutput = {
    eid: resp.eid,
    directives,
  };
  if (resp.raisedEvents && resp.raisedEvents.length > 0) {
    out.events = resp.raisedEvents.map((e) => ({
      domain: e.domain,
      name: e.name,
      data: e.data,
      attrs: e.data?.attrs,
    }));
  }
  if (resp.ruleOutcomes && resp.ruleOutcomes.length > 0) {
    out.ruleOutcomes = resp.ruleOutcomes;
  }
  return out;
}
