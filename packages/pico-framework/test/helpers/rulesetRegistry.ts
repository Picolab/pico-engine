/**
 * Shared test ruleset registry for pico-framework tests.
 */

import { Ruleset, RulesetLoader } from "../../src";

export function rulesetRegistry() {
  let rulesets = new Map<string, Ruleset>();

  function add(rs: Ruleset) {
    rulesets.set(rs.rid, rs);
  }

  function get(rid: string) {
    const rs = rulesets.get(rid);
    if (rs) {
      return rs;
    }
    throw new Error(`Ruleset not found: ${rid}`);
  }

  const loader: RulesetLoader = (picoId: string, rid: string, config: any) => {
    return get(rid);
  };

  return { add, get, loader };
}
