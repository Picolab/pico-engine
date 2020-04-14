import { AbstractLevelDOWN } from "abstract-leveldown";
import * as _ from "lodash";
import { PicoFramework } from "pico-framework";
import * as krl from "./krl";
import { RulesetEnvironment } from "./KrlCtx";
import { KrlLogger } from "./KrlLogger";
import { schedulerStartup } from "./modules/schedule";
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
  const rsEnvironment = new RulesetEnvironment(log, rsRegistry);

  if (configuration.modules) {
    _.each(configuration.modules, function (mod, domain) {
      rsEnvironment.modules[domain] = mod;
    });
  }

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
      }
    },

    useEventInputTime: configuration.useEventInputTime,
  });

  const schdlr = schedulerStartup(pf);
  rsEnvironment.addScheduledEvent = schdlr.addScheduledEvent;
  rsEnvironment.removeScheduledEvent = schdlr.removeScheduledEvent;
  rsEnvironment.picoFramework = pf;
  await schdlr.start();

  await pf.start();

  return {
    version,
    pf,
    rsRegistry,
  };
}
