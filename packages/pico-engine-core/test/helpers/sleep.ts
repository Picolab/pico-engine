/**
 * Promise-based sleep helper for async test timing.
 */

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
