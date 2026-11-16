/**
 * JSON dump helpers to inspect in-memory pico structure after reload.
 */

import { PicoFramework } from "../../src";
import { Pico } from "../../src/Pico";
import { dbRange } from "../../src/dbRange";

/**
 * dump the in-memory structure
 * to test if the picos are saved and reloaded at startup
 */
export function jsonDumpPico(pf: PicoFramework, pico: Pico): any {
  const json: any = Object.assign({}, pico.toReadOnly());
  json.childrenPicos = pico.children.map(eci => {
    const { pico } = pf.lookupChannel(eci);
    return jsonDumpPico(pf, pico);
  });
  return json;
}

export function getAllECIsFromDB(pf: PicoFramework): Promise<string[]> {
  return dbRange(pf.db, { prefix: ["pico-channel"] }, function(data) {
    return data.key[1];
  });
}
