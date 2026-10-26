import { PicoEngine, PicoEngineConfiguration, startEngine } from "./index";
import { applyConfigCliArgs, resolveEngineSettings } from "./engineConfig";
const version = require("../package.json").version;

let argv: string[];
try {
  argv = applyConfigCliArgs(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

if (argv[0] === "mcp") {
  import("./runMcp")
    .then(({ runMcpCli }) => runMcpCli(argv))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else if (argv[0] === "config" && argv[1] === "path") {
  const { resolveEngineConfigFilePath, defaultEngineConfigFilePath } =
    require("./engineConfig");
  const target = resolveEngineConfigFilePath();
  console.log(target);
  if (target === defaultEngineConfigFilePath()) {
    console.error(
      "(default; copy packages/pico-engine/config.example.json here to customize)",
    );
  }
  process.exit(0);
} else {
  startPicoEngineCli();
}

function startPicoEngineCli() {
const args: {
  help: boolean;
  version: boolean;
} = require("minimist")(argv, {
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

    pico-engine [--config|-c <path>] [--version] [--help|-h]
    pico-engine [--config|-c <path>] config path
    pico-engine [--config|-c <path>] mcp --stdio

Multiple engines on one machine: use a separate config file per process (unique
home, port, baseUrl). Examples: packages/pico-engine/config.instances.example/
and docker/config/ for compose.

Configuration (preferred):

    ~/.config/pico-engine/config.json
    (or --config / PICO_ENGINE_CONFIG to another file path)

    See packages/pico-engine/config.example.json (and config.policy-ceiling.example.json for 1.8 policy fields).
    Precedence: defaults → environment variables → config file → tests/API overrides.
    (Config file wins over PORT and PICO_ENGINE_HOME when both are set; env fills gaps the file omits.)

Environment (optional; Docker/CI when not set in config file):

    PORT - HTTP listen port
    PICO_ENGINE_CONFIG - Path to config JSON (default ~/.config/pico-engine/config.json)
    PICO_ENGINE_HOME - Data directory (DB, ruleset cache); overridden by config "home" when present
    PICO_ENGINE_BASE_URL - Public URL (WebAuthn, did:webvh)
    PICO_ENGINE_RP_ID / PICO_ENGINE_ORIGIN - WebAuthn (or use webauthn block in config file)
    PICO_ENGINE_ALLOW_SELF_SIGNUP - "true"/"1" or "false"/"0"
    PICO_ENGINE_ALLOW_LOCALHOST_C - "0" disables localhost /c/* bypass (see config allowLocalhostChannelBypass)
    PICO_ENGINE_WILDCARD_SKY_REQUIRE_BEARER - "1" enables wildcard /sky/* bearer requirement
    PICO_ENGINE_LOG_FILE - Log path, or stdout/- / 0 for console only
`);
  process.exit(0);
}

const settings = resolveEngineSettings({});
const env: PicoEngineConfiguration = {
  home: settings.home,
  port: settings.port,
  base_url: settings.baseUrl,
  rpID: settings.rpID,
  rpName: settings.rpName,
  origin: settings.origin,
  allowSelfSignup: settings.allowSelfSignup,
};

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
}
