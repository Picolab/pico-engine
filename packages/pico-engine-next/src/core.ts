import { AbstractLevelDOWN } from "abstract-leveldown";
import { krl, KrlLogger, PicoLogEntry } from "krl-stdlib";
import * as _ from "lodash";
import { PicoFramework } from "pico-framework";
import module_ctx from "./modules/ctx";
import module_event from "./modules/event";
import { initScheduleModule } from "./modules/schedule";
import module_stdlib from "./modules/stdlib";
import module_time from "./modules/time";
import { RulesetEnvironment } from "./RulesetEnvironment";
import { RulesetRegistry, RulesetRegistryLoader } from "./RulesetRegistry";

const version = require("../package.json").version;

/**
 * Configuration options that may be set by the user
 */
export interface PicoEngineCoreConfiguration {
  leveldown: AbstractLevelDOWN;
  genID?: () => string;

  rsRegLoader: RulesetRegistryLoader;

  log: KrlLogger;

  getPicoLogs(picoId: string): Promise<PicoLogEntry[]>;

  /**
   * Provide any custom krl modules
   */
  modules?: { [domain: string]: krl.Module };

  /**
   * Trust event.time input. Used for testing
   */
  useEventInputTime?: boolean;
}

export interface PicoEngineCore {
  version: string;
  pf: PicoFramework;
  rsRegistry: RulesetRegistry;
}

export async function startPicoEngineCore(
  configuration: PicoEngineCoreConfiguration
): Promise<PicoEngineCore> {
  const log = configuration.log;
  const rsRegistry = new RulesetRegistry(configuration.rsRegLoader);
  const rsEnvironment = new RulesetEnvironment(
    log,
    rsRegistry,
    configuration.getPicoLogs
  );

  const pf = new PicoFramework({
    leveldown: configuration.leveldown,
    genID: configuration.genID,

    environment: rsEnvironment,

    rulesetLoader: rsRegistry.loader,

    onStartupRulesetInitError(picoId, rid, version, config, error) {
      // TODO mark it as not installed and raise an error event
      log.error("onStartupRulesetInitError", {
        picoId,
        rid,
        rulesetVersion: version,
        rulesetConfig: config,
        error,
      });
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
            txn: ev.txn,
          });
          break;
        case "txnStart":
        case "txnDone":
        case "txnError":
          log.debug(ev.type, { picoId: ev.picoId, txnId: ev.txn.id });
          break;
        case "eventScheduleAdded":
          log.debug("event added to schedule", {
            picoId: ev.picoId,
            txnId: ev.txn.id,
            rid: ev.rid,
            event: ev.event,
          });
          break;
        case "eventScheduleCleared":
          log.debug("schedule cleared", {
            picoId: ev.picoId,
            txnId: ev.txn.id,
          });
          break;
      }
    },

    useEventInputTime: configuration.useEventInputTime,
  });

  rsEnvironment.picoFramework = pf;

  rsEnvironment.modules["ctx"] = module_ctx;
  rsEnvironment.modules["event"] = module_event;
  rsEnvironment.modules["stdlib"] = module_stdlib;
  rsEnvironment.modules["time"] = module_time;

  const scheduler = initScheduleModule(pf);
  rsEnvironment.modules["schedule"] = scheduler.module;

  if (configuration.modules) {
    _.each(configuration.modules, function (mod, domain) {
      rsEnvironment.modules[domain] = mod;
    });
  }

  await scheduler.start();
  await pf.start();

  return {
    version,
    pf,
    rsRegistry,
  };
}
