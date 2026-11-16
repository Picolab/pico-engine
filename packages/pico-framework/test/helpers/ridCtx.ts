/**
 * Test ruleset exposing ctx API for unit tests.
 */

import { Ruleset } from "../../src/Ruleset";

/**
 * A test ruleset to expose the `ctx` api
 */
export const ridCtx: Ruleset = {
  rid: "rid.ctx",
  init(ctx) {
    let lastResult: any;
    return {
      async event(event) {
        const attrs = (event.data && event.data.attrs) || {};
        if (event.domain === "ctx") {
          lastResult = null;
          lastResult = await (ctx as any)[event.name].apply(null, attrs.args);
        }
      },
      query: {
        pico: () => ctx.pico(),
        ruleset: () => ctx.ruleset,
        _lastResult: () => lastResult,
      },
    };
  },
};
