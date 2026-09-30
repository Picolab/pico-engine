/**
 * Remap ECI strings embedded in entity state after subtree import.
 */

/** Deep-replace string values that match keys in eciMap. */
export function remapEcisDeep(
  value: unknown,
  eciMap: Record<string, string>
): unknown {
  if (typeof value === "string" && eciMap[value]) {
    return eciMap[value];
  }
  if (Array.isArray(value)) {
    return value.map((item) => remapEcisDeep(item, eciMap));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = remapEcisDeep(child, eciMap);
    }
    return out;
  }
  return value;
}
