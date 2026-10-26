import { RulesetRegistry } from "./RulesetRegistry";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const krlCheck = require("krl-compiler/src/check") as (
  src: string,
  options?: { filepath?: string; parser_options?: { filename?: string } }
) => {
  ok: boolean;
  rid: string | null;
  errors: Array<{ message: string; line?: number; column?: number; severity?: string }>;
  warnings: Array<{ message: string; line?: number; column?: number; severity?: string }>;
};

export interface ValidateKrlResult {
  ok: boolean;
  rid: string | null;
  errors: Array<{ message: string; line?: number; column?: number }>;
  warnings: Array<{ message: string; line?: number; column?: number }>;
}

function stripDiagnostics<T extends { message: string; line?: number; column?: number }>(
  list: T[]
): Array<{ message: string; line?: number; column?: number }> {
  return (list || []).map(({ message, line, column }) => ({
    message,
    line,
    column,
  }));
}

function looksLikeKrlSource(source: string): boolean {
  return /^\s*ruleset\s+/m.test(source);
}

export function validateKrlSource(
  source: string,
  filepath?: string
): ValidateKrlResult {
  const out = krlCheck(source, {
    filepath,
    parser_options: { filename: filepath },
  });
  return {
    ok: out.ok,
    rid: out.rid,
    errors: stripDiagnostics(out.errors),
    warnings: stripDiagnostics(out.warnings),
  };
}

function errorFromLoad(err: unknown): ValidateKrlResult["errors"] {
  const e = err as Error & {
    krl_compiler?: { loc?: { start?: { line?: number; column?: number } } };
    where?: { line?: number; col?: number };
  };
  let line = e.where?.line;
  let column = e.where?.col;
  if (e.krl_compiler?.loc?.start) {
    line = e.krl_compiler.loc.start.line;
    column = e.krl_compiler.loc.start.column;
  }
  const suffix =
    line != null && column != null ? ` at ${line}:${column}` : "";
  return [{ message: (e.message || String(err)) + suffix, line, column }];
}

function warningsFromCached(compiler: unknown): ValidateKrlResult["warnings"] {
  if (!compiler || typeof compiler !== "object") return [];
  const w = (compiler as { warnings?: unknown[] }).warnings;
  if (!Array.isArray(w)) return [];
  return w
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const msg = (item as { message?: string }).message;
      if (typeof msg !== "string") return null;
      const loc = (item as { loc?: { start?: { line?: number; column?: number } } })
        .loc?.start;
      return {
        message: msg,
        line: loc?.line,
        column: loc?.column,
      };
    })
    .filter(Boolean) as ValidateKrlResult["warnings"];
}

/** Validate KRL source text or a ruleset URL (fetch + compile, no install). */
export async function validateKrl(
  sourceOrUrl: string,
  rsRegistry: RulesetRegistry
): Promise<ValidateKrlResult> {
  const input = String(sourceOrUrl || "");
  if (!input.trim()) {
    return {
      ok: false,
      rid: null,
      errors: [{ message: "Expected KRL source or ruleset URL" }],
      warnings: [],
    };
  }
  if (looksLikeKrlSource(input)) {
    return validateKrlSource(input);
  }
  try {
    const loaded = await rsRegistry.load(input);
    const cached = rsRegistry.getCached(loaded.url || input);
    return {
      ok: true,
      rid: loaded.rid,
      errors: [],
      warnings: warningsFromCached(cached?.compiler),
    };
  } catch (err) {
    return {
      ok: false,
      rid: null,
      errors: errorFromLoad(err),
      warnings: [],
    };
  }
}
