import { krl, KrlLogger, makeKrlLogger } from "krl-stdlib";
import { ClassicLevel } from "classic-level";
import * as _ from "lodash";
import * as makeDir from "make-dir";
import * as path from "path";
import { PicoEngineCore, RulesetRegistry } from "pico-engine-core";
import { PicoDbKey, PicoFramework } from "pico-framework";
import { AuthService, WebAuthnAdapter, makeWebAuthnAdapter } from "./auth";
import { OAuthService, initOAuthModule } from "./oauth";
import { getPicoLogs, makeRotatingFileLogWriter } from "./logging";
import { provisionRoot, uiECIForRoot } from "./provisionRoot";
import { RulesetRegistryLoaderFs } from "./RulesetRegistryLoaderFs";
import { server } from "./server";
const charwise = require("charwise");
const safeJsonCodec = require("level-json-coerce-null");

const homeDir = require("home-dir");
const version = require("../package.json").version;

/**
 * Configuration options that may be set by the user
 */
export interface PicoEngineConfiguration {
  /**
   * The absolute path to the folder where the engine should store the database and logs.
   *
   * Default: "~/.pico-engine/"
   */
  home?: string;

  /**
   * The port number the http server should listen on.
   *
   * If you want an available port assigned to you, set it to 0
   *
   * Default: 3000
   */
  port?: number;

  /**
   * The base url others should use when addressing your engine.
   *
   * Default: "http://localhost:3000"
   */
  base_url?: string;

  /**
   * Provide any custom krl modules
   */
  modules?: { [domain: string]: krl.Module };

  /**
   * Trust event.time input. Used for testing
   */
  useEventInputTime?: boolean;

  log?: KrlLogger;

  /**
   * WebAuthn relying-party id (a registrable domain). Defaults to the hostname
   * of `base_url` (e.g. "localhost").
   */
  rpID?: string;

  /**
   * Human-friendly relying-party name shown by the OS passkey UI.
   */
  rpName?: string;

  /**
   * Expected WebAuthn origin (scheme://host[:port]). Defaults to the origin of
   * `base_url`.
   */
  origin?: string;

  /**
   * When true, anyone may register additional accounts/roots after bootstrap.
   * When false (default), only bootstrap (zero accounts), legacy claim, or a valid
   * invite may create a new account.
   */
  allowSelfSignup?: boolean;

  /**
   * Override the WebAuthn ceremony/verification implementation. Intended for
   * testing with a deterministic authenticator.
   */
  webauthn?: WebAuthnAdapter;

  /**
   * When true, boot auto-creates a single root (historical behavior). Defaults
   * to false — fresh engines start with zero roots until passkey registration.
   * Tests may set this to true.
   */
  autoCreateRootPico?: boolean;
}

export interface PicoEngine {
  version: string;

  home: string;
  port: number;
  base_url: string;

  pf: PicoFramework;
  /** UI channel for the session root; null when no roots exist yet at boot. */
  uiECI: string | null;
  rsRegistry: RulesetRegistry;
  auth: AuthService;
  oauth: OAuthService;
}

export async function startEngine(
  configuration: PicoEngineConfiguration = {}
): Promise<PicoEngine> {
  let home = configuration.home;
  let port = configuration.port;
  let base_url = configuration.base_url;

  if (typeof home !== "string") {
    const envHome = process.env.PICO_ENGINE_HOME;
    if (
      typeof envHome === "string" &&
      envHome.length > 0 &&
      process.env.NODE_ENV === "test"
    ) {
      home = envHome;
    } else {
      home = homeDir(".pico-engine") as string;
    }
  }
  await makeDir(home);

  const logFilePath = path.resolve(home, "pico-engine.log");
  const log = configuration.log
    ? configuration.log
    : makeKrlLogger(makeRotatingFileLogWriter(logFilePath));

  const core = new PicoEngineCore({
    db: new ClassicLevel<PicoDbKey, any>(path.resolve(home, "db"), {
      keyEncoding: charwise,
      valueEncoding: safeJsonCodec,
    }),
    rsRegLoader: RulesetRegistryLoaderFs(home),
    log,
    modules: configuration.modules,
    useEventInputTime: configuration.useEventInputTime,
    autoCreateRootPico: configuration.autoCreateRootPico ?? false,
    getPicoLogs(picoId) {
      return getPicoLogs(logFilePath, picoId);
    },
  });
  await core.start();
  const rsRegistry = core.rsRegistry;
  const pf = core.picoFramework;

  // Fresh engines boot with zero roots. Adopt + (re)provision only when roots
  // already exist (test harness with autoCreateRootPico, or a migrated DB).
  let uiECI: string | null = null;
  const existingRoots = pf.rootPicos();
  if (existingRoots.length > 0) {
    const provisioned = await provisionRoot(pf, core, { root: existingRoots[0] });
    uiECI = provisioned.uiECI;
  }

  const auth = new AuthService({
    db: pf.db,
    webauthn: configuration.webauthn || makeWebAuthnAdapter(),
    getBaseUrl: () => core.base_url,
    rpID: configuration.rpID,
    rpName: configuration.rpName,
    origin: configuration.origin,
    allowSelfSignup: configuration.allowSelfSignup ?? false,
    flushBootstrapUrl: async (url) => {
      const flushed = await rsRegistry.flush(url);
      return { rid: flushed.rid };
    },
    provisionRoot: async (opts) => {
      const { root, uiECI } = await provisionRoot(pf, core, opts);
      return { rootPicoId: root.id, uiECI };
    },
    getUiECI: (rootPicoId: string) => uiECIForRoot(pf, rootPicoId),
    getPrimaryRootPicoId: () => {
      try {
        return pf.rootPico.id;
      } catch {
        return null;
      }
    },
    onAccountClaimed: async (rootPicoId, displayName) => {
      const uiChannel = uiECIForRoot(pf, rootPicoId);
      if (!uiChannel || !displayName.trim()) {
        return;
      }
      await pf.eventWait({
        eci: uiChannel,
        domain: "engine_ui",
        name: "box",
        data: { attrs: { name: displayName.trim() } },
        time: 0,
      });
    },
  });

  const oauth = new OAuthService({
    db: pf.db,
    pf,
  });
  core.modules["oauth"] = initOAuthModule(oauth);

  const app = server(core, uiECI, auth, oauth);

  if ((!port || !_.isInteger(port) || port < 1) && port !== 0) {
    port = process.env.NODE_ENV === "test" ? 0 : 3000;
  }
  await new Promise((resolve) => {
    const listener = app.listen(port, () => {
      if (listener) {
        const addr = listener.address();
        if (addr && typeof addr !== "string" && _.isInteger(addr.port)) {
          // Get the actual port i.e. if they set port to 0 nodejs will assign you an available port
          port = addr.port;
        }
      }
      resolve(undefined);
    });
  });
  if (typeof base_url !== "string") {
    base_url = `http://localhost:${port}`;
  }
  core.base_url = base_url;

  log.info(`Listening at ${base_url}`);

  if (uiECI) {
    pf.event({
      eci: uiECI,
      domain: "engine",
      name: "started",
      data: { attrs: {} },
      time: 0, // TODO remove this typescript requirement
    }).catch((error) => {
      log.error("Error signaling engine:started event", { error });
    });
  }

  return {
    version,

    home,
    port,
    base_url,

    pf,
    uiECI,
    rsRegistry,
    auth,
    oauth,
  };
}
