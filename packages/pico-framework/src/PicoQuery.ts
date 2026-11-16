import * as _ from "lodash";
import { isNotStringOrBlank } from "./utils";

export interface PicoQuery {
  eci: string;
  rid: string;
  name: string;
  args: {
    [key: string]: any;
  };
}

/**
 * Given a query json (i.e. from the web, or somewhere untrusted)
 *   + assert the required pieces are there
 *   + normalize the shape/naming conventions
 *   + make a full copy (clone) as to not mutate the original
 */
export function cleanQuery(queryOrig: any): PicoQuery {
  if (isNotStringOrBlank(queryOrig && queryOrig.eci)) {
    throw new Error("missing query.eci");
  }
  if (isNotStringOrBlank(queryOrig.rid)) {
    throw new Error("missing query.rid");
  }
  if (isNotStringOrBlank(queryOrig.name)) {
    throw new Error("missing query.name");
  }

  let args = {};
  if (queryOrig.hasOwnProperty("args")) {
    // we want to make sure only json-able values are in the args
    // also want to clone it as to not mutate the original copy
    const json = JSON.stringify(queryOrig.args);
    // only if it's a map do we consider it valid
    if (json && json[0] === "{") {
      args = JSON.parse(json);
    } else {
      throw new Error("Expected a JSON map for query.args");
    }
  }

  return {
    eci: queryOrig.eci.trim(),
    rid: queryOrig.rid.trim(),
    name: queryOrig.name.trim(),
    args: args,
  };
}
