import {
  PicoFramework,
  ChannelConfig,
  RulesetInstance,
  ChannelReadOnly
} from "pico-framework";
import { inputToConf, PicoEngineSettings } from "./configuration";
import { server } from "./server";
import makeDir from "make-dir";
import { RulesetContext } from "pico-framework/dist/src/RulesetContext";
const leveldown = require("leveldown");

async function upsertChannel(
  ctx: RulesetContext,
  conf: ChannelConfig
): Promise<ChannelReadOnly> {
  if (!conf.tags || conf.tags.length === 0) {
    throw new TypeError("upsertChannel needs tags set");
  }
  const searchTags = conf.tags
    .slice(0)
    .sort()
    .join(",");
  let uiChannel = ctx.pico().channels.find(chann => {
    return (
      searchTags ===
      chann.tags
        .slice(0)
        .sort()
        .join(",")
    );
  });
  if (uiChannel) {
    await ctx.putChannel(uiChannel.id, conf);
  } else {
    uiChannel = await ctx.newChannel(conf);
  }
  return uiChannel;
}

export async function startEngine(settings?: PicoEngineSettings) {
  const conf = inputToConf(settings);

  await makeDir(conf.home);

  const pf = new PicoFramework({
    leveldown: leveldown(conf.db_path)
  });
  pf.addRuleset({
    rid: "io.picolabs.next",
    version: "0.0.0",
    async init(ctx): Promise<RulesetInstance> {
      const uiChannel = await upsertChannel(ctx, {
        tags: ["engine", "ui"],
        eventPolicy: { allow: [{ domain: "engine-ui", name: "*" }], deny: [] },
        queryPolicy: {
          allow: [{ rid: "io.picolabs.next", name: "pico" }],
          deny: []
        }
      });
      return {
        event(event) {},
        query: {
          uiECI() {
            return uiChannel.id;
          },
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
  const uiChannel = await Object.values(pf.rootPico.channels).find(chann => {
    return (
      "engine,ui" ===
      chann.tags
        .slice(0)
        .sort()
        .join(",")
    );
  });

  console.log(`Starting pico-engine-NEXT ${conf.version}`);
  console.log(conf);

  const app = server(pf, conf, uiChannel ? uiChannel.id : "");
  await new Promise((resolve, reject) =>
    app.listen(conf.port, (err: any) => (err ? reject(err) : resolve()))
  );

  console.log(`Listening on ${conf.base_url}`);

  // TODO  pf.event ... engine:started
}
