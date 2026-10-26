import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type {
  EventPolicyRule,
  PolicyCeiling,
  QueryPolicyRule,
} from "pico-framework";
import {
  parseGlobalEventDenyFromJson,
  parseGlobalQueryDenyFromJson,
  parsePolicyCeilingFromJson,
} from "./policyConfigFromJson";

const homeDir = require("home-dir") as (sub?: string) => string;

/**
 * Operator settings (file + env). Ephemeral state stays under {@link home} (DB, cache, logs).
 * Config file default: ~/.config/pico-engine/config.json (override with PICO_ENGINE_CONFIG).
 */
export interface EngineSettings {
  home: string;
  port: number;
  baseUrl: string;
  rpID?: string;
  rpName?: string;
  origin?: string;
  allowSelfSignup: boolean;
  /** When true, localhost may call /c/* without passkey (dev MCP, ctx HTTP loops). */
  allowLocalhostChannelBypass: boolean;
  wildcardSkyRequireBearer: boolean;
  logToStdout: boolean;
  /** Absolute log file path; ignored when logToStdout is true. */
  logFile?: string;
  /** Max channel policy for root picos when none stored on the pico (1.8). */
  defaultRootPolicyCeiling?: PolicyCeiling;
  /** Deny rules applied on every ECI before per-channel policy (1.8). */
  globalEventDeny?: EventPolicyRule[];
  globalQueryDeny?: QueryPolicyRule[];
}

export interface EngineSettingsOverrides {
  home?: string;
  port?: number;
  baseUrl?: string;
  base_url?: string;
  rpID?: string;
  rpName?: string;
  origin?: string;
  allowSelfSignup?: boolean;
  allowLocalhostChannelBypass?: boolean;
  wildcardSkyRequireBearer?: boolean;
  logToStdout?: boolean;
  logFile?: string;
  defaultRootPolicyCeiling?: PolicyCeiling;
  globalEventDeny?: EventPolicyRule[];
  globalQueryDeny?: QueryPolicyRule[];
}

let runtimeSettings: EngineSettings | null = null;

export function installEngineRuntimeSettings(settings: EngineSettings): void {
  runtimeSettings = settings;
}

export function getEngineRuntimeSettings(): EngineSettings {
  if (!runtimeSettings) {
    runtimeSettings = defaultEngineSettings();
  }
  return runtimeSettings;
}

export function defaultEngineSettings(): EngineSettings {
  return {
    home: homeDir(".pico-engine") as string,
    port: 3000,
    baseUrl: "http://localhost:3000",
    allowSelfSignup: false,
    allowLocalhostChannelBypass: true,
    wildcardSkyRequireBearer: false,
    logToStdout: false,
  };
}

export function defaultEngineConfigFilePath(): string {
  const xdg =
    process.env.XDG_CONFIG_HOME &&
    process.env.XDG_CONFIG_HOME.trim().length > 0
      ? process.env.XDG_CONFIG_HOME
      : path.join(os.homedir(), ".config");
  return path.join(xdg, "pico-engine", "config.json");
}

export function resolveEngineConfigFilePath(): string {
  const explicit = process.env.PICO_ENGINE_CONFIG;
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    return path.resolve(expandHome(explicit.trim()));
  }
  return defaultEngineConfigFilePath();
}

/**
 * Parse `--config` / `-c` from argv and set `PICO_ENGINE_CONFIG` before settings resolve.
 * Use one config file per engine process (host or container).
 */
export function applyConfigCliArgs(argv: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config" || arg === "-c") {
      const val = argv[++i];
      if (typeof val !== "string" || val.length === 0) {
        throw new Error(`${arg} requires a config file path`);
      }
      process.env.PICO_ENGINE_CONFIG = path.resolve(expandHome(val));
      continue;
    }
    if (arg.startsWith("--config=")) {
      const val = arg.slice("--config=".length);
      if (val.length === 0) {
        throw new Error("--config= requires a config file path");
      }
      process.env.PICO_ENGINE_CONFIG = path.resolve(expandHome(val));
      continue;
    }
    out.push(arg);
  }
  return out;
}

function expandHome(p: string): string {
  if (p.startsWith("~/")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

function parseConfigFile(raw: string): Partial<EngineSettings> {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid engine config JSON (${resolveEngineConfigFilePath()}): ${err}`,
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Engine config must be a JSON object");
  }
  const o = data as Record<string, unknown>;
  const out: Partial<EngineSettings> = {};

  if (typeof o.home === "string" && o.home.length > 0) {
    out.home = expandHome(o.home);
  }
  if (typeof o.port === "number" && o.port >= 0) {
    out.port = o.port;
  }
  if (typeof o.baseUrl === "string" && o.baseUrl.length > 0) {
    out.baseUrl = o.baseUrl;
  }
  const webauthn =
    o.webauthn && typeof o.webauthn === "object" && !Array.isArray(o.webauthn)
      ? (o.webauthn as Record<string, unknown>)
      : null;
  if (webauthn) {
    if (typeof webauthn.rpId === "string") out.rpID = webauthn.rpId;
    if (typeof webauthn.rpName === "string") out.rpName = webauthn.rpName;
    if (typeof webauthn.origin === "string") out.origin = webauthn.origin;
  }
  if (typeof o.rpID === "string") out.rpID = o.rpID;
  if (typeof o.rpName === "string") out.rpName = o.rpName;
  if (typeof o.origin === "string") out.origin = o.origin;
  if (typeof o.allowSelfSignup === "boolean") {
    out.allowSelfSignup = o.allowSelfSignup;
  }
  if (typeof o.allowLocalhostChannelBypass === "boolean") {
    out.allowLocalhostChannelBypass = o.allowLocalhostChannelBypass;
  }
  if (typeof o.wildcardSkyRequireBearer === "boolean") {
    out.wildcardSkyRequireBearer = o.wildcardSkyRequireBearer;
  }
  if (typeof o.logToStdout === "boolean") {
    out.logToStdout = o.logToStdout;
  }
  if (typeof o.logFile === "string" && o.logFile.length > 0) {
    if (o.logFile === "stdout" || o.logFile === "-") {
      out.logToStdout = true;
    } else {
      out.logFile = path.resolve(expandHome(o.logFile));
    }
  }
  const rootCeiling = parsePolicyCeilingFromJson(
    o.defaultRootPolicyCeiling,
    "defaultRootPolicyCeiling",
  );
  if (rootCeiling) {
    out.defaultRootPolicyCeiling = rootCeiling;
  }
  const globalEventDeny = parseGlobalEventDenyFromJson(o.globalEventDeny);
  if (globalEventDeny) {
    out.globalEventDeny = globalEventDeny;
  }
  const globalQueryDeny = parseGlobalQueryDenyFromJson(o.globalQueryDeny);
  if (globalQueryDeny) {
    out.globalQueryDeny = globalQueryDeny;
  }

  return out;
}

export function loadConfigFileSettings(): Partial<EngineSettings> {
  if (process.env.NODE_ENV === "test" && !process.env.PICO_ENGINE_CONFIG) {
    return {};
  }
  const filePath = resolveEngineConfigFilePath();
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return parseConfigFile(raw);
}

function parseBoolEnv(val: string | undefined): boolean | undefined {
  if (val === undefined) return undefined;
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return undefined;
}

export function settingsFromEnv(): Partial<EngineSettings> {
  const out: Partial<EngineSettings> = {};

  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (port >= 0) out.port = port;
  }
  if (
    typeof process.env.PICO_ENGINE_HOME === "string" &&
    process.env.PICO_ENGINE_HOME.length > 0
  ) {
    out.home = expandHome(process.env.PICO_ENGINE_HOME);
  }
  if (
    typeof process.env.PICO_ENGINE_BASE_URL === "string" &&
    process.env.PICO_ENGINE_BASE_URL.length > 0
  ) {
    out.baseUrl = process.env.PICO_ENGINE_BASE_URL;
  }
  if (
    typeof process.env.PICO_ENGINE_RP_ID === "string" &&
    process.env.PICO_ENGINE_RP_ID.length > 0
  ) {
    out.rpID = process.env.PICO_ENGINE_RP_ID;
  }
  if (
    typeof process.env.PICO_ENGINE_ORIGIN === "string" &&
    process.env.PICO_ENGINE_ORIGIN.length > 0
  ) {
    out.origin = process.env.PICO_ENGINE_ORIGIN;
  }
  const signup = parseBoolEnv(process.env.PICO_ENGINE_ALLOW_SELF_SIGNUP);
  if (signup !== undefined) out.allowSelfSignup = signup;
  const localhostC = parseBoolEnv(process.env.PICO_ENGINE_ALLOW_LOCALHOST_C);
  if (localhostC !== undefined) {
    out.allowLocalhostChannelBypass = localhostC;
  } else if (process.env.PICO_ENGINE_ALLOW_LOCALHOST_C === "0") {
    out.allowLocalhostChannelBypass = false;
  }
  const wildcard = parseBoolEnv(
    process.env.PICO_ENGINE_WILDCARD_SKY_REQUIRE_BEARER,
  );
  if (wildcard !== undefined) out.wildcardSkyRequireBearer = wildcard;
  const logFile = process.env.PICO_ENGINE_LOG_FILE;
  if (logFile === "0" || logFile === "-" || logFile === "stdout" || logFile === "") {
    out.logToStdout = true;
  } else if (typeof logFile === "string" && logFile.length > 0) {
    out.logFile = path.resolve(expandHome(logFile));
  }

  return out;
}

function mergeSettings(
  base: EngineSettings,
  ...layers: Partial<EngineSettings>[]
): EngineSettings {
  const merged = { ...base };
  for (const layer of layers) {
    Object.assign(merged, layer);
  }
  return merged;
}

/**
 * Resolve settings: defaults ← environment ← config file ← programmatic (tests, API).
 * `PORT` and `PICO_ENGINE_HOME` (and other env keys) apply when the file omits them;
 * values in the config file win when both are set.
 */
export function resolveEngineSettings(
  programmatic: EngineSettingsOverrides = {},
): EngineSettings {
  const fromProgrammatic: Partial<EngineSettings> = {};
  if (programmatic.home) fromProgrammatic.home = programmatic.home;
  if (programmatic.port != null) fromProgrammatic.port = programmatic.port;
  const baseUrl = programmatic.baseUrl ?? programmatic.base_url;
  if (baseUrl) fromProgrammatic.baseUrl = baseUrl;
  if (programmatic.rpID) fromProgrammatic.rpID = programmatic.rpID;
  if (programmatic.rpName) fromProgrammatic.rpName = programmatic.rpName;
  if (programmatic.origin) fromProgrammatic.origin = programmatic.origin;
  if (programmatic.allowSelfSignup !== undefined) {
    fromProgrammatic.allowSelfSignup = programmatic.allowSelfSignup;
  }
  if (programmatic.allowLocalhostChannelBypass !== undefined) {
    fromProgrammatic.allowLocalhostChannelBypass =
      programmatic.allowLocalhostChannelBypass;
  }
  if (programmatic.wildcardSkyRequireBearer !== undefined) {
    fromProgrammatic.wildcardSkyRequireBearer =
      programmatic.wildcardSkyRequireBearer;
  }
  if (programmatic.logToStdout !== undefined) {
    fromProgrammatic.logToStdout = programmatic.logToStdout;
  }
  if (programmatic.logFile !== undefined) {
    fromProgrammatic.logFile = programmatic.logFile;
  }
  if (programmatic.defaultRootPolicyCeiling !== undefined) {
    fromProgrammatic.defaultRootPolicyCeiling =
      programmatic.defaultRootPolicyCeiling;
  }
  if (programmatic.globalEventDeny !== undefined) {
    fromProgrammatic.globalEventDeny = programmatic.globalEventDeny;
  }
  if (programmatic.globalQueryDeny !== undefined) {
    fromProgrammatic.globalQueryDeny = programmatic.globalQueryDeny;
  }

  return mergeSettings(
    defaultEngineSettings(),
    settingsFromEnv(),
    loadConfigFileSettings(),
    fromProgrammatic,
  );
}
