import leveldown from "leveldown";
import * as makeDir from "make-dir";
import { PicoFramework, RulesetConfig } from "pico-framework";
import { Pico } from "pico-framework/dist/src/Pico";
import { inputToConf, PicoEngineSettings } from "./configuration";
import { rsNext } from "./io.picolabs.next";
import { server } from "./server";

export async function startEngine(settings?: PicoEngineSettings) {
  const conf = inputToConf(settings);

  await makeDir(conf.home);

  const pf = new PicoFramework({
    leveldown: leveldown(conf.db_path) as any,

    rulesetLoader(rid: string, version: string) {
      return conf.rsRegistry.load(rid, version);
    },

    onStartupRulesetInitError(
      pico: Pico,
      rid: string,
      version: string,
      config: RulesetConfig,
      error: any
    ) {
      // TODO mark it as not installed and raise an error event
      // throw error;
      console.error("TODO raise error", pico.id, rid, version, config, error);
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

  console.log(`Starting pico-engine-NEXT ${conf.version}`);
  console.log(conf);

  const app = server(pf, conf, uiECI);
  await new Promise((resolve, reject) =>
    app.listen(conf.port, (err: any) => (err ? reject(err) : resolve()))
  );

  console.log(`Listening on ${conf.base_url}`);

  pf.event({
    eci: uiECI,
    domain: "engine",
    name: "started",
    data: { attrs: {} },
    time: 0 // TODO remove this typescript requirement
  }).catch(err => {
    console.error(err);
    // TODO signal all errors engine:error
  });
}
