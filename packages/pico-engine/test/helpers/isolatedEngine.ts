/**
 * Start an engine in an isolated temp home with an ephemeral port.
 */

import { PicoEngineConfiguration, startEngine } from "../../src/index";
import { tmpHome } from "./tmpHome";

export { tmpHome, namedTestHome } from "./tmpHome";

/**
 * Start an engine in an isolated temp home with an ephemeral port. Sets
 * PICO_ENGINE_HOME for the duration of the call so nothing falls back to
 * ~/.pico-engine even if `home` is omitted from config.
 */
export async function startIsolatedEngine(
  configuration: PicoEngineConfiguration = {}
) {
  const home = configuration.home || tmpHome();
  process.env.PICO_ENGINE_HOME = home;
  delete process.env.PORT;
  delete process.env.PICO_ENGINE_BASE_URL;

  return startEngine({
    ...configuration,
    home,
    port: configuration.port ?? 0,
  });
}
