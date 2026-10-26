/** Extract install/flush failure attrs from an event-wait JSON body. */

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function formatErrors(errors: unknown): string {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "Install or flush failed";
  }
  return errors
    .map((e) => {
      const row = asRecord(e);
      if (!row || typeof row.message !== "string") {
        return String(e);
      }
      const line = row.line;
      const column = row.column;
      if (line != null && column != null) {
        return `${row.message} (${line}:${column})`;
      }
      return row.message;
    })
    .join("; ");
}

function scanForWranglerEvent(
  node: unknown,
  name: string
): Record<string, unknown> | null {
  const obj = asRecord(node);
  if (!obj) return null;
  if (obj.domain === "wrangler" && obj.name === name) {
    const data = asRecord(obj.data);
    const attrs = asRecord(data?.attrs);
    return attrs;
  }
  for (const key of ["responses", "directives", "events"]) {
    const list = obj[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const hit = scanForWranglerEvent(item, name);
      if (hit) return hit;
      const dir = asRecord(item);
      const ev = asRecord(dir?.options)?.event ?? dir?.event;
      if (ev) {
        const e = asRecord(ev);
        if (e?.domain === "wrangler" && e?.name === name) {
          return asRecord(asRecord(e.data)?.attrs) ?? asRecord(e.attrs);
        }
      }
    }
  }
  return null;
}

export function installFailureMessage(data: unknown): string | null {
  const failed = scanForWranglerEvent(data, "ruleset_install_failed");
  if (!failed) return null;
  return formatErrors(failed.errors);
}

export function flushFailureMessage(data: unknown): string | null {
  const failed = scanForWranglerEvent(data, "ruleset_flush_failed");
  if (!failed) return null;
  return formatErrors(failed.errors);
}
