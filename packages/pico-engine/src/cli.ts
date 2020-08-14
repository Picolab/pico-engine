import { PicoEngineConfiguration, startEngine } from "./index";

const args: {
  help: boolean;
  version: boolean;
} = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "version"],
  alias: {
    help: "h",
  },
});

if (args.help) {
  console.log(`
USAGE

    pico-engine [--version] [--help|-h]

Environment Variables:

    PORT - The port the http server should listen on. By default it's 8080
    PICO_ENGINE_HOME - Where the database and other files should be stored. By default it's ~/.pico-engine/
    PICO_ENGINE_BASE_URL - The public url prefix to reach this engine. By default it's http://localhost:$PORT
`);
  process.exit(0);
}

const env: PicoEngineConfiguration = {};

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

startEngine(env).catch((err) => {
  console.error("Failed to start engine.");
  console.error(err);
  process.exit(1);
});
