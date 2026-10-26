/**
 * Normalize ruleset response arrays into directive name/options for assertions.
 */

import { Directive } from "krl-stdlib";
import * as _ from "lodash";

export function cleanDirectives(responses: any[]): Directive[] {
  const parts = responses.flatMap((response) => {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.directives)) {
      return response.directives;
    }
    return [];
  });
  return _.compact(parts);
}
