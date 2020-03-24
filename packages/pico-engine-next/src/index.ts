import leveldown from "leveldown";
import * as _ from "lodash";
import * as makeDir from "make-dir";
import * as path from "path";
import { ChannelConfig, ChannelReadOnly, PicoFramework } from "pico-framework";
import { Pico } from "pico-framework/dist/src/Pico";
import * as krl from "./krl";
import { RulesetEnvironment } from "./KrlCtx";
import { getRotatingFileStream, KrlLogger } from "./KrlLogger";
import { schedulerStartup } from "./modules/schedule";
import { RulesetRegistry } from "./RulesetRegistry";
import { RulesetRegistryLoaderFs } from "./RulesetRegistryLoaderFs";
import { server } from "./server";
import { toFileUrl } from "./utils/toFileUrl";

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

  const filePath = path.resolve(home, "pico-engine.log");
  const log = configuration.log
    ? configuration.log
    : new KrlLogger(getRotatingFileStream(filePath), "");
  const rsRegistry = new RulesetRegistry(RulesetRegistryLoaderFs(home));
  const rsEnvironment = new RulesetEnvironment(log, rsRegistry);

  if (configuration.modules) {
    _.each(configuration.modules, function(mod, domain) {
      rsEnvironment.modules[domain] = mod;
    });
  }

  const pf = new PicoFramework({
    leveldown: leveldown(path.resolve(home, "db")) as any,

    environment: rsEnvironment,

    rulesetLoader: rsRegistry.loader,

    onStartupRulesetInitError(picoId, rs, config, error) {
      // TODO mark it as not installed and raise an error event
      console.error(
        "TODO raise error",
        picoId,
        rs.rid,
        rs.version,
        config,
        error
      );
    },

    onFrameworkEvent(ev) {
      switch (ev.type) {
        case "startup":
          break;
        case "startupDone":
          log.debug("pico-framework started");
          break;
        case "txnQueued":
          log.debug(ev.type, {
            picoId: ev.picoId,
            txnId: ev.txn.id,
            txn: ev.txn
          });
          break;
        case "txnStart":
        case "txnDone":
        case "txnError":
          log.debug(ev.type, { picoId: ev.picoId, txnId: ev.txn.id });
          break;
      }
    },

    useEventInputTime: configuration.useEventInputTime
  });

  function eciToPicoId(eci: string): string {
    try {
      const pico = pf.getPico(eci);
      return pico.id;
    } catch (err) {
      return eci;
    }
  }

  rsRegistry.normalizePicoId = eciToPicoId;

  const schdlr = schedulerStartup(pf);
  rsEnvironment.addScheduledEvent = schdlr.addScheduledEvent;
  rsEnvironment.removeScheduledEvent = schdlr.removeScheduledEvent;
  await schdlr.start();

  await pf.start();

  const url = toFileUrl(path.resolve(__dirname, "..", "io.picolabs.next.krl"));
  await rsRegistry.subscribe(pf.rootPico.id, url);
  const { ruleset } = await rsRegistry.flush(url);
  await pf.rootPico.install(ruleset);
  let uiChannel = pf.rootPico.toReadOnly().channels.find(
    chann =>
      "engine,ui" ===
      chann.tags
        .slice(0)
        .sort()
        .join(",")
  );
  if (!uiChannel) {
    uiChannel = (
      await pf.rootPico.newChannel({
        tags: ["engine", "ui"],
        eventPolicy: {
          allow: [{ domain: "engine_ui", name: "setup" }],
          deny: []
        }
      })
    ).toReadOnly();
  }
  await pf.eventWait({
    eci: uiChannel.id,
    domain: "engine_ui",
    name: "setup",
    data: { attrs: {} },
    time: 0
  });

  const uiECI = uiChannel.id;

  const app = server(pf, uiECI);

  if ((!port || !_.isInteger(port) || port < 1) && port !== 0) {
    port = 3000;
  }
  await new Promise(resolve => {
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
    time: 0 // TODO remove this typescript requirement
  }).catch(error => {
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
    rsRegistry
  };
}
