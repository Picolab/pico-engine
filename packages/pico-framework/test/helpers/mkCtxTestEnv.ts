/**
 * Minimal ctx API test environment with ridCtx ruleset.
 */

import { ridCtx } from "./ridCtx";
import { testPicoFramework } from "./testPicoFramework";

export async function mkCtxTestEnv() {
  const { pf, eci, rsReg, genID } = await testPicoFramework([ridCtx]);

  function event(name: string, args: any[] = []) {
    return pf.eventQuery(
      {
        eci,
        domain: "ctx",
        name,
        data: { attrs: { args } },
        time: Date.now()
      },
      {
        eci,
        rid: "rid.ctx",
        name: "_lastResult",
        args: {}
      }
    );
  }

  function query(name: string, args: any = {}) {
    return pf.query({ eci, rid: "rid.ctx", name, args });
  }

  return { pf, eci, event, query, rsReg, genID };
}
