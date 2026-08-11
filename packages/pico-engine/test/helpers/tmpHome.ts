/**
 * Test and demo PICO_ENGINE_HOME paths under /tmp (never ~/.pico-engine).
 */

import * as cuid from "cuid";
import * as path from "path";

const TEST_HOME_ROOT = "/tmp/pico-engine";

/** Random isolated home for automated tests: `/tmp/pico-engine/{cuid}`. */
export function tmpHome(): string {
  return path.join(TEST_HOME_ROOT, cuid());
}

/** Fixed path for manual multi-engine demos, e.g. `namedTestHome("pico-engine-a")`. */
export function namedTestHome(name: string): string {
  return path.join("/tmp", name);
}
