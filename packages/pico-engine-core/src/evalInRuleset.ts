import { createRulesetContext, Pico } from "pico-framework";
import { PicoEngineCore } from "./PicoEngineCore";
import { makeKrlCtx } from "./makeKrlCtx";

const compileEvalExpression = require("krl-compiler").compileEvalExpression as (
  expr: string,
  opts: { rulesetKrl: string }
) => {
  warnings: unknown[];
  run: (ctx: unknown, g: Record<string, unknown>) => Promise<unknown>;
};

export interface ConsoleEvalResult {
  ok: boolean;
  value?: unknown;
  error?: string;
  loc?: unknown;
  warnings?: unknown[];
}

/** Owner console: evaluate a KRL expression in an installed ruleset's context. */
export async function evalInRuleset(
  core: PicoEngineCore,
  picoId: string,
  eci: string,
  rid: string,
  expr: string
): Promise<ConsoleEvalResult> {
  let pico: Pico;
  try {
    pico = core.picoFramework.getPico(picoId);
  } catch {
    return { ok: false, error: "Pico not found" };
  }

  const installed = pico.rulesets[rid];
  if (!installed?.instance?.query?.__consoleEval) {
    return {
      ok: false,
      error: `Ruleset ${rid} is not installed or console eval is unavailable (flush after upgrade)`,
    };
  }

  try {
    const data = await core.picoFramework.query(
      {
        eci,
        rid,
        name: "__consoleEval",
        args: { expr: String(expr) },
      },
      picoId
    );
    return { ok: true, value: data };
  } catch (err: unknown) {
    const e = err as Error & { krl_compiler?: { loc?: unknown } };
    return {
      ok: false,
      error: e.message || String(err),
      loc: e.krl_compiler?.loc,
    };
  }
}

/** Direct eval (tests): bypasses query policy, still uses pico queue via query. */
export async function evalInRulesetDirect(
  core: PicoEngineCore,
  picoId: string,
  rid: string,
  expr: string
): Promise<ConsoleEvalResult> {
  let pico: Pico;
  try {
    pico = core.picoFramework.getPico(picoId);
  } catch {
    return { ok: false, error: "Pico not found" };
  }
  const installed = pico.rulesets[rid];
  if (!installed) {
    return { ok: false, error: `Ruleset ${rid} not installed` };
  }
  const url = installed.config?.url;
  const cached = url ? core.rsRegistry.getCached(url) : null;
  const rulesetKrl = cached?.krl;
  if (!rulesetKrl) {
    return { ok: false, error: "Ruleset KRL source not in registry cache" };
  }
  const instance = installed.instance as {
    consoleGlobalRefs?: Record<string, unknown>;
  };
  const grefs = instance.consoleGlobalRefs;
  if (!grefs) {
    return { ok: false, error: "Missing consoleGlobalRefs on ruleset instance" };
  }

  let compiled: {
    warnings: unknown[];
    run: (ctx: unknown, g: Record<string, unknown>) => Promise<unknown>;
  };
  try {
    compiled = compileEvalExpression(expr, { rulesetKrl });
  } catch (err: unknown) {
    const e = err as Error & { krl_compiler?: { loc?: unknown } };
    return {
      ok: false,
      error: e.message || String(err),
      loc: e.krl_compiler?.loc,
      warnings: [],
    };
  }

  const rsCtx = createRulesetContext(core.picoFramework, pico, {
    rid,
    config: installed.config,
  });
  const krlCtx = makeKrlCtx(core, rsCtx);

  try {
    const value = await compiled.run(krlCtx, grefs);
    return { ok: true, value, warnings: compiled.warnings };
  } catch (err: unknown) {
    const e = err as Error & { krl_compiler?: { loc?: unknown } };
    return {
      ok: false,
      error: e.message || String(err),
      loc: e.krl_compiler?.loc,
      warnings: compiled.warnings,
    };
  }
}
