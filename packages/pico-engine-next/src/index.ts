import { PicoFramework } from "pico-framework";
import { inputToConf, PicoEngineSettings } from "./configuration";
import { server } from "./server";
import makeDir from "make-dir";
import { ChannelConfig } from "pico-framework/dist/src/Channel";
const leveldown = require("leveldown");

export async function startEngine(settings?: PicoEngineSettings) {
  const conf = inputToConf(settings);

  await makeDir(conf.home);

  const pf = new PicoFramework({
    leveldown: leveldown(conf.db_path)
  });
  pf.addRuleset({
    rid: "io.picolabs.next",
    version: "0.0.0",
    init(ctx) {
      return {
        event(event) {},
        query: {
          pico(args) {
            return ctx.pico();
          }
        }
      };
    }
  });
  // TODO need to add ALL rulesets used in db before start
  await pf.start();
  await pf.rootPico.install("io.picolabs.next", "0.0.0");
  let uiChannel = Object.values(pf.rootPico.channels).find(chann => {
    return (
      "engine,ui" ===
      chann.tags
        .slice(0)
        .sort()
        .join(",")
    );
  });
  const uiChanConf: ChannelConfig = {
    tags: ["engine", "ui"],
    eventPolicy: { allow: [{ domain: "engine-ui", name: "*" }], deny: [] },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.next", name: "pico" }],
      deny: []
    }
  };
  if (uiChannel) {
    await pf.rootPico.putChannel(uiChannel.id, uiChanConf);
  } else {
    uiChannel = await pf.rootPico.newChannel(uiChanConf);
  }

  console.log(`Starting pico-engine-NEXT ${conf.version}`);
  console.log(conf);

  const app = server(pf, conf, uiChannel.id);
  await new Promise((resolve, reject) =>
    app.listen(conf.port, (err: any) => (err ? reject(err) : resolve()))
  );

  console.log(`Listening on ${conf.base_url}`);

  // TODO  pf.event ... engine:started
}
