/** Short emit line for Testing tab (aligned with krl-schema markdown wording). */

export function emitSummaryLine(
  e: Record<string, unknown>,
  opCondition?: string | null
): string {
  const via = e.via as string | undefined;
  let verb: string;
  if (via === "send") {
    const d = e.domain && e.type ? `${e.domain}:${e.type}` : "event";
    verb = `may send ${d}`;
    if (e.replyTo) verb += ` (replyTo ${String(e.replyTo)})`;
  } else if (via === "schedule") {
    const d = e.domain && e.type ? `${e.domain}:${e.type}` : "event";
    verb = `may schedule ${d}`;
  } else if (via === "action") {
    verb = `may call ${String(e.name || e.source || "action")}`;
  } else {
    const ev =
      e.domain && e.type ? `${e.domain}:${e.type}` : "internal event";
    verb = `may raise ${ev}`;
  }
  const when = e.when as Array<Record<string, unknown>> | undefined;
  if (when && when.length) {
    const parts = when
      .map((w) => {
        if (w.condition) return String(w.condition);
        if (w.branch) return String(w.branch);
        return "";
      })
      .filter(Boolean);
    if (parts.length) verb += ` — when ${parts.join(", ")}`;
  } else if (opCondition) {
    verb += ` — when ${opCondition}`;
  }
  return verb;
}

export function precheckSummaryLine(p: Record<string, unknown>): string {
  if (p.call) return String(p.call);
  const fn = String(p.fn || "?");
  const args = p.args as Record<string, { attr?: string }> | undefined;
  if (!args || !Object.keys(args).length) return `${fn}()`;
  const detail = Object.entries(args)
    .map(([k, v]) => `${k}: ${v?.attr ? `attr ${v.attr}` : "?"}`)
    .join("; ");
  return `${fn}(${Object.keys(args).join(", ")}) (${detail})`;
}
