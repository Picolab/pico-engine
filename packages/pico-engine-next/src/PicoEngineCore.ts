import { krl, KrlLogger, PicoLogEntry } from "krl-stdlib";
import { PicoFramework, RulesetContext } from "pico-framework";
import { CorePico } from "./CorePico";
import { makeKrlCtx } from "./makeKrlCtx";
import initCtxModule from "./modules/ctx";
import module_event from "./modules/event";
import { initScheduleModule } from "./modules/schedule";
import initHttpModule from "./modules/http";
import module_stdlib from "./modules/stdlib";
import module_time from "./modules/time";
import { PicoEngineCoreConfiguration } from "./PicoEngineCoreConfiguration";
import { CachedRuleset, RulesetRegistry } from "./RulesetRegistry";

const version = require("../package.json").version;

export class PicoEngineCore {
  readonly version: string = version;

  log: KrlLogger;
  rsRegistry: RulesetRegistry;
  getPicoLogs: (picoId: string) => Promise<PicoLogEntry[]>;
  modules: { [domain: string]: krl.Module } = {};
  picoFramework: PicoFramework;

  private picos: { [picoId: string]: CorePico } = {};
  private startupModules: (() => Promise<any>)[] = [];

  constructor(conf: PicoEngineCoreConfiguration) {
    const log = (this.log = conf.log);
    this.getPicoLogs = conf.getPicoLogs;
    this.rsRegistry = new RulesetRegistry(conf.rsRegLoader, (crs) =>
      this.onRulesetLoaded(crs)
    );

    this.picoFramework = new PicoFramework({
      leveldown: conf.leveldown,
      genID: conf.genID,
      useEventInputTime: conf.useEventInputTime,

      environment: (rsCtx: RulesetContext) => makeKrlCtx(this, rsCtx),

      rulesetLoader: this.rsRegistry.loader,

      onFrameworkEvent(ev) {
        switch (ev.type) {
          case "startup":
            break;
          case "startupDone":
            log.debug("pico-framework started");
            break;
          case "startupRulesetInitError":
            log.error("onStartupRulesetInitError", {
              picoId: ev.picoId,
              rid: ev.rid,
              rulesetConfig: ev.config,
              error: ev.error,
            });
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
    });

    this.modules["ctx"] = initCtxModule(this);
    this.modules["event"] = module_event;
    this.modules["stdlib"] = module_stdlib;
    this.modules["time"] = module_time;
    this.modules["http"] = initHttpModule(this);

    const scheduler = initScheduleModule(this.picoFramework);
    this.modules["schedule"] = scheduler.module;
    this.startupModules.push(scheduler.start);

    if (conf.modules) {
      for (const domain of Object.keys(conf.modules)) {
        this.modules[domain] = conf.modules[domain];
      }
    }
  }

  async start() {
    for (const startModule of this.startupModules) {
      await startModule();
    }
    await this.picoFramework.start();
  }

  onRulesetLoaded(crs: CachedRuleset) {
    this.picoFramework.reInitRuleset(crs.ruleset);
    for (const picoId of Object.keys(this.picos)) {
      this.picos[picoId].onRulesetLoaded(crs);
    }
  }

  addPico(picoId: string): CorePico {
    if (!this.picos[picoId]) {
      this.picos[picoId] = new CorePico(this);
    }
    return this.picos[picoId];
  }

  getPico(picoId: string): CorePico | null {
    return this.picos[picoId] || null;
  }
}
