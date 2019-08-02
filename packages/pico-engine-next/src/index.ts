import leveldown from "leveldown";
import * as _ from "lodash";
import * as makeDir from "make-dir";
import * as path from "path";
import { PicoFramework } from "pico-framework";
import { rsNext } from "./io.picolabs.next";
import * as krl from "./krl";
import { RulesetEnvironment } from "./KrlCtx";
import { getRotatingFileStream, KrlLogger } from "./KrlLogger";
import { ScheduledEvent } from "./modules/schedule";
import { RulesetRegistry } from "./RulesetRegistry";
import { Scheduler } from "./Scheduler";
import { server } from "./server";

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
  const rsRegistry = new RulesetRegistry(home);
  const rsEnvironment = new RulesetEnvironment(log);

  if (configuration.modules) {
    _.each(configuration.modules, function(mod, domain) {
      rsEnvironment.modules[domain] = mod;
    });
  }

  const pf = new PicoFramework({
    leveldown: leveldown(path.resolve(home, "db")) as any,

    environment: rsEnvironment,

    rulesetLoader(rid, version) {
      return rsRegistry.load(rid, version);
    },

    onStartupRulesetInitError(pico, rid, version, config, error) {
      // TODO mark it as not installed and raise an error event
      // throw error;
      console.error("TODO raise error", pico.id, rid, version, config, error);
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

  pf.addRuleset(rsNext);

  const scheduler = new Scheduler();

  function addScheduledEvent(rid: string, sEvent: ScheduledEvent) {
    if (sEvent.type === "at") {
      scheduler.addFuture(sEvent.id, sEvent.time, async () => {
        const pico = pf.getPico(sEvent.event.eci);
        if (pico) {
          // TODO wrap in pico transaction
          const schedule = (await pico.getEnt(rid, "_schedule")) || {};
          const job = schedule[sEvent.id];
          if (job) {
            await pico.putEnt(rid, "_schedule", _.omit(schedule, sEvent.id));
            pico.event(sEvent.event);
          }
        }
      });
    } else if (sEvent.type === "repeat") {
      scheduler.addCron(sEvent.id, sEvent.timespec, async () => {
        let found = false;
        const pico = pf.getPico(sEvent.event.eci);
        if (pico) {
          // TODO wrap in pico transaction
          const schedule = (await pico.getEnt(rid, "_schedule")) || {};
          const job = schedule[sEvent.id];
          if (job) {
            found = true;
            pico.event(sEvent.event);
          }
        }
        if (!found) {
          scheduler.remove(sEvent.id);
        }
      });
    }
  }

  rsEnvironment.addScheduledEvent = addScheduledEvent;
  rsEnvironment.removeScheduledEvent = id => scheduler.remove(id);

  await new Promise((resolve, reject) => {
    const s = pf.db.createReadStream({
      gte: ["entvar"],
      lte: ["entvar", undefined] // charwise sorts with null at the bottom and undefined at the top
    });
    s.on("error", reject);
    s.on("end", () => resolve());
    s.on("data", data => {
      if (data.key[3] === "_schedule") {
        const rid = data.key[2];
        const value: { [id: string]: ScheduledEvent } = data.value;
        for (const sEvent of Object.values(value)) {
          addScheduledEvent(rid, sEvent);
        }
      }
    });
  });

  await pf.start();
  await pf.rootPico.install("io.picolabs.next", "0.0.0");
  const uiChannel = await Object.values(pf.rootPico.channels).find(chann => {
    return (
      "engine,ui" ===
      chann.tags
        .slice(0)
        .sort()
        .join(",")
    );
  });
  const uiECI = uiChannel ? uiChannel.id : "";

  const app = server(pf, uiECI, rsRegistry);

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
