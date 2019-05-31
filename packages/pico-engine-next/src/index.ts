import leveldown from "leveldown";
import { PicoFramework } from "pico-framework";
import { inputToConf, PicoEngineSettings } from "./configuration";
import { rsNext } from "./io.picolabs.next";
import { server } from "./server";

export async function startEngine(
  settings?: PicoEngineSettings,
  dontStartHttp?: boolean
) {
  const conf = await inputToConf(settings);

  conf.log.info("Starting pico-engine", {
    home: conf.home,
    port: conf.port,
    base_url: conf.base_url,
    log_path: conf.log_path,
    db_path: conf.db_path,
    version: conf.version
  });

  const pf = new PicoFramework({
    leveldown: leveldown(conf.db_path) as any,

    environment: conf.rsEnvironment,

    rulesetLoader(rid, version) {
      return conf.rsRegistry.load(rid, version);
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
          conf.log.debug("pico-framework started");
          break;
        case "txnQueued":
          conf.log.debug(ev.type, {
            picoId: ev.picoId,
            txnId: ev.txn.id,
            txn: ev.txn
          });
          break;
        case "txnStart":
        case "txnDone":
        case "txnError":
          conf.log.debug(ev.type, { picoId: ev.picoId, txnId: ev.txn.id });
          break;
      }
    }
  });

  pf.addRuleset(rsNext);

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

  const app = server(pf, conf, uiECI);

  if (dontStartHttp === true) {
    // dont start
  } else {
    await new Promise((resolve, reject) =>
      app.listen(conf.port, () => resolve())
    );
  }

  conf.log.info(`Listening at ${conf.base_url}`);

  pf.event({
    eci: uiECI,
    domain: "engine",
    name: "started",
    data: { attrs: {} },
    time: 0 // TODO remove this typescript requirement
  }).catch(error => {
    conf.log.error("Error signaling engine:started event", { error });
    // TODO signal all errors engine:error
  });

  return {
    conf,
    pf,
    app
  };
}
