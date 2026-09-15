import { PicoEngine, PicoEngineConfiguration, startEngine } from "./index";
const version = require("../package.json").version;

const args: {
  help: boolean;
  version: boolean;
} = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "version"],
  alias: {
    help: "h",
  },
});

if (args.version) {
  console.log(version);
  process.exit(0);
}
if (args.help) {
  console.log(`
USAGE

    pico-engine [--version] [--help|-h]

Environment Variables:

    PORT - The port the http server should listen on. By default it's 3000
    PICO_ENGINE_HOME - Where the database and other files should be stored. By default it's ~/.pico-engine/
    PICO_ENGINE_BASE_URL - The public url prefix to reach this engine. By default it's http://localhost:$PORT
    PICO_ENGINE_ALLOW_SELF_SIGNUP - Set to "true" or "1" to allow anyone to register a new account
        after the engine is bootstrapped. Default is false (login only; bootstrap and invite still work).
    PICO_ENGINE_ALLOW_LOCALHOST_C - Set to "0" to require passkey session on /c/* even from localhost.
        Default (unset) allows localhost without session for in-engine ctx:event HTTP loops. See MEMORY.md.
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

const allowSelfSignupEnv = process.env.PICO_ENGINE_ALLOW_SELF_SIGNUP;
if (allowSelfSignupEnv === "true" || allowSelfSignupEnv === "1") {
  env.allowSelfSignup = true;
} else if (allowSelfSignupEnv === "false" || allowSelfSignupEnv === "0") {
  env.allowSelfSignup = false;
}

function installGracefulShutdown(engine: PicoEngine) {
  let shuttingDown = false;

  const onSignal = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down`);
    engine
      .shutdown()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error("Shutdown failed.");
        console.error(err);
        process.exit(1);
      });
  };

  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);
}

startEngine(env)
  .then((engine) => {
    installGracefulShutdown(engine);
  })
  .catch((err) => {
    console.error("Failed to start engine.");
    console.error(err);
    process.exit(1);
  });
