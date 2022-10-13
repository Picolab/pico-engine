import { Directive } from "krl-stdlib";
import * as _ from "lodash";

export function cleanDirectives(
  responses: any[]
): { name: string; options: { [key: string]: any } }[] {
  return _.compact(_.flattenDeep(responses)).map((a) => {
    return a && a.type === "directive"
      ? { name: a.name, options: a.options }
      : a;
  });
}
