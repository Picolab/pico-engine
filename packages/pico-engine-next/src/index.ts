import leveldown from "leveldown";
import * as makeDir from "make-dir";
import { PicoFramework } from "pico-framework";
import { inputToConf, PicoEngineSettings } from "./configuration";
import { rsNext } from "./io.picolabs.next";
import { $krl } from "./krl";
import { server } from "./server";

const helloWorld = require("../../../test-rulesets/hello-world.js");

export async function startEngine(settings?: PicoEngineSettings) {
  const conf = inputToConf(settings);

  await makeDir(conf.home);

  const pf = new PicoFramework({
    leveldown: leveldown(conf.db_path)
  });

  pf.addRuleset(rsNext);

  // TODO need to add ALL rulesets used in db before start
  pf.addRuleset(helloWorld($krl));

  // TODO if ruleset is not loaded then mark it as not installed and raise an error event

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
