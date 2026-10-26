import test from "ava";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  applyConfigCliArgs,
  installEngineRuntimeSettings,
  loadConfigFileSettings,
  resolveEngineSettings,
  settingsFromEnv,
} from "../src/engineConfig";

test("resolveEngineSettings: env then file (file wins) then programmatic", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pe-config-"));
  const configPath = path.join(dir, "config.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      home: path.join(dir, "data-from-file"),
      port: 4000,
      wildcardSkyRequireBearer: true,
    }),
  );
  process.env.PICO_ENGINE_CONFIG = configPath;
  process.env.PORT = "5000";
  process.env.PICO_ENGINE_HOME = path.join(dir, "data-from-env");

  const settings = resolveEngineSettings({
    home: path.join(dir, "data-programmatic"),
  });

  t.is(settings.home, path.join(dir, "data-programmatic"));
  t.is(settings.port, 4000);
  t.true(settings.wildcardSkyRequireBearer);

  delete process.env.PICO_ENGINE_CONFIG;
  delete process.env.PORT;
  delete process.env.PICO_ENGINE_HOME;
  fs.rmSync(dir, { recursive: true, force: true });
});

test("resolveEngineSettings: PORT and PICO_ENGINE_HOME when omitted from config file", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pe-config-"));
  const configPath = path.join(dir, "config.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({ wildcardSkyRequireBearer: false }),
  );
  process.env.PICO_ENGINE_CONFIG = configPath;
  process.env.PORT = "5010";
  process.env.PICO_ENGINE_HOME = path.join(dir, "data-from-env-only");

  const settings = resolveEngineSettings({});

  t.is(settings.home, path.join(dir, "data-from-env-only"));
  t.is(settings.port, 5010);

  delete process.env.PICO_ENGINE_CONFIG;
  delete process.env.PORT;
  delete process.env.PICO_ENGINE_HOME;
  fs.rmSync(dir, { recursive: true, force: true });
});

test("installEngineRuntimeSettings drives security flags", (t) => {
  installEngineRuntimeSettings({
    home: "/tmp/x",
    port: 3000,
    baseUrl: "http://localhost:3000",
    allowSelfSignup: false,
    allowLocalhostChannelBypass: false,
    wildcardSkyRequireBearer: true,
    logToStdout: false,
  });
  const { wildcardSkyRequireBearerEnabled } = require("../src/channelIdentityPolicy");
  t.true(wildcardSkyRequireBearerEnabled());
});

test("applyConfigCliArgs sets PICO_ENGINE_CONFIG and strips flags", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pe-config-"));
  const configPath = path.join(dir, "mine.json");
  fs.writeFileSync(configPath, "{}");

  const rest = applyConfigCliArgs([
    "--config",
    configPath,
    "mcp",
    "--stdio",
  ]);
  t.deepEqual(rest, ["mcp", "--stdio"]);
  t.is(process.env.PICO_ENGINE_CONFIG, configPath);

  delete process.env.PICO_ENGINE_CONFIG;
  fs.rmSync(dir, { recursive: true, force: true });
});

test("settingsFromEnv maps legacy localhost flag", (t) => {
  process.env.PICO_ENGINE_ALLOW_LOCALHOST_C = "0";
  const s = settingsFromEnv();
  t.is(s.allowLocalhostChannelBypass, false);
  delete process.env.PICO_ENGINE_ALLOW_LOCALHOST_C;
});
