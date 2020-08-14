import { krl, KrlLogger, makeKrlLogger } from "krl-stdlib";
import leveldown from "leveldown";
import * as _ from "lodash";
import * as makeDir from "make-dir";
import * as path from "path";
import { PicoEngineCore, RulesetRegistry } from "pico-engine-core";
import { PicoFramework } from "pico-framework";
import { getPicoLogs, makeRotatingFileLogWriter } from "./logging";
import { RulesetRegistryLoaderFs } from "./RulesetRegistryLoaderFs";
import { server } from "./server";
import { toFileUrl } from "./utils/toFileUrl";
import * as fs from "fs";
import { reject } from "lodash";

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
}

export interface PicoEngine {
  version: string;

  home: string;
  port: number;
  base_url: string;

  pf: PicoFramework;
  uiECI: string;
  rsRegistry: RulesetRegistry;
}

export async function startEngine(
  configuration: PicoEngineConfiguration = {}
): Promise<PicoEngine> {
  let home = configuration.home;
  let port = configuration.port;
  let base_url = configuration.base_url;

  if (typeof home !== "string") {
    home = homeDir(".pico-engine") as string;
  }
  await makeDir(home);

  const logFilePath = path.resolve(home, "pico-engine.log");
  const log = configuration.log
    ? configuration.log
    : makeKrlLogger(makeRotatingFileLogWriter(logFilePath));

  const core = new PicoEngineCore({
    leveldown: leveldown(path.resolve(home, "db")) as any,
    rsRegLoader: RulesetRegistryLoaderFs(home),
    log,
    modules: configuration.modules,
    useEventInputTime: configuration.useEventInputTime,
    getPicoLogs(picoId) {
      return getPicoLogs(logFilePath, picoId);
    },
  });
  await core.start();
  const rsRegistry = core.rsRegistry;
  const pf = core.picoFramework;

  const krl_dir = path.resolve(__dirname, "..", "krl");
  const krl_urls: string[] = await new Promise((resolve, reject) =>
    fs.readdir(krl_dir, (err, files) => {
      if (err) reject(err);
      else resolve(files.map((file) => toFileUrl(path.resolve(krl_dir, file))));
    })
  );
  for (const url of krl_urls) {
    const { ruleset } = await rsRegistry.flush(url);
    await pf.rootPico.install(ruleset, { url, config: {} });
  }

  let uiChannel = pf.rootPico
    .toReadOnly()
    .channels.find(
      (chann) => "engine,ui" === chann.tags.slice(0).sort().join(",")
    );
  if (!uiChannel) {
    uiChannel = (
      await pf.rootPico.newChannel({
        tags: ["engine", "ui"],
        eventPolicy: {
          allow: [{ domain: "engine_ui", name: "setup" }],
          deny: [],
        },
      })
    ).toReadOnly();
  }
  await pf.eventWait({
    eci: uiChannel.id,
    domain: "engine_ui",
    name: "setup",
    data: { attrs: {} },
    time: 0,
  });

  const uiECI = uiChannel.id;

  const app = server(pf, uiECI);

  if ((!port || !_.isInteger(port) || port < 1) && port !== 0) {
    port = 3000;
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
      resolve();
    });
  });
  if (typeof base_url !== "string") {
    base_url = `http://localhost:${port}`;
  }

  log.info(`Listening at ${base_url}`);

  pf.event({
    eci: uiECI,
    domain: "engine",
    name: "started",
    data: { attrs: {} },
    time: 0, // TODO remove this typescript requirement
  }).catch((error) => {
    log.error("Error signaling engine:started event", { error });
    // TODO signal all errors engine:error
  });

  return {
    version,

    home,
    port,
    base_url,

    pf,
    uiECI,
    rsRegistry,
  };
}
