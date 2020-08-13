import { AbstractLevelDOWN } from "abstract-leveldown";
import { krl, KrlLogger, PicoLogEntry } from "krl-stdlib";
import * as _ from "lodash";
import { PicoFramework, RulesetContext } from "pico-framework";
import { KrlCtxMakerConfig, makeKrlCtx } from "./makeKrlCtx";
import initCtxModule from "./modules/ctx";
import module_event from "./modules/event";
import { initScheduleModule } from "./modules/schedule";
import module_stdlib from "./modules/stdlib";
import module_time from "./modules/time";
import { PicoRidDependencies } from "./PicoRidDependencies";
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

  const environment: KrlCtxMakerConfig = {
    log,
    rsRegistry,
    getPicoLogs: configuration.getPicoLogs,
    modules: {},
    picoRidDependencies: new PicoRidDependencies(),
  };

  const pf = new PicoFramework({
    leveldown: configuration.leveldown,
    genID: configuration.genID,

    environment: (rsCtx: RulesetContext) => makeKrlCtx(environment, rsCtx),

    rulesetLoader: rsRegistry.loader,

    onStartupRulesetInitError(picoId, rid, config, error) {
      // TODO mark it as not installed and raise an error event
      log.error("onStartupRulesetInitError", {
        picoId,
        rid,
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

  environment.picoFramework = pf;

  environment.modules["ctx"] = initCtxModule(
    rsRegistry,
    pf,
    environment.picoRidDependencies
  );
  environment.modules["event"] = module_event;
  environment.modules["stdlib"] = module_stdlib;
  environment.modules["time"] = module_time;

  const scheduler = initScheduleModule(pf);
  environment.modules["schedule"] = scheduler.module;

  if (configuration.modules) {
    _.each(configuration.modules, function (mod, domain) {
      environment.modules[domain] = mod;
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
