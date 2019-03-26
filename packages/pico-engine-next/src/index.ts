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
          allow: [
            { rid: "io.picolabs.next", name: "uiECI" },
            { rid: "io.picolabs.next", name: "box" }
          ],
          deny: []
        }
      });

      return {
        event(event) {},
        query: {
          async box() {
            const [bgColor, name, x, y, w, h] = await Promise.all([
              ctx.getEnt("name"),
              ctx.getEnt("backgroundColor"),

              ctx.getEnt("x"),
              ctx.getEnt("y"),
              ctx.getEnt("width"),
              ctx.getEnt("height")
            ]);

            return {
              eci: uiChannel.id,
              children: await Promise.all(
                ctx.pico().children.map(eci => {
                  return ctx.query({
                    eci,
                    rid: "io.picolabs.next",
                    name: "uiECI",
                    args: {}
                  });
                })
              ),

              name: name || "Pico",
              backgroundColor: bgColor || "#87cefa",

              x: x || 100,
              y: y || 100,
              width: w || 100,
              height: h || 100
            };
          },
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
