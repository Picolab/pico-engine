/** Expected query failures (policy, missing ruleset, bad ECI) — not engine bugs. */
export function isRoutineQueryError(err: unknown): boolean {
  const message = err + "";
  return (
    /ECI not found/i.test(message) ||
    /doesn't have .* installed/i.test(message) ||
    /(Denied|Not allowed) by channel policy/i.test(message)
  );
}
