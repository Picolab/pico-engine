/** Normalize @example attrs/args for form defaultValue (shared by Testing and Docs). */
export function defaultsFromExampleRecord(
  record: Record<string, unknown> | undefined
): Record<string, string | number | boolean> | undefined {
  if (!record) return undefined;
  const defaults: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(record)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      defaults[k] = v;
    } else if (v != null) {
      defaults[k] = JSON.stringify(v);
    }
  }
  return Object.keys(defaults).length ? defaults : undefined;
}
