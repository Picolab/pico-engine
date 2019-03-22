import { startEngine } from "./index";
import { PicoEngineSettings } from "./configuration";

const env: PicoEngineSettings = {};

if (process.env.PORT) {
  const port = parseInt(process.env.PORT, 10);
  if (port > 0) {
    env.port = port;
  }
}

if (
  typeof process.env.PICO_ENGINE_HOME === "string" &&
  process.env.PICO_ENGINE_HOME.length > 0
) {
  env.home = process.env.PICO_ENGINE_HOME;
}

if (
  typeof process.env.PICO_ENGINE_BASE_URL === "string" &&
  process.env.PICO_ENGINE_BASE_URL.length > 0
) {
  env.base_url = process.env.PICO_ENGINE_BASE_URL;
}

startEngine(env).catch(err => {
  console.error("Failed to start engine.");
  console.error(err);
  process.exit(1);
});
