import { Directive } from "krl-stdlib";
import * as _ from "lodash";

export function cleanDirectives(responses: any[]): Directive[] {
  return _.compact(_.flattenDeep(responses));
}
