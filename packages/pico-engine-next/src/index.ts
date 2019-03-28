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
        eventPolicy: {
          allow: [
            { domain: "engine-ui", name: "box" },
            { domain: "engine-ui", name: "new" },
            { domain: "engine-ui", name: "del" },
            { domain: "engine-ui", name: "install" },
            { domain: "engine-ui", name: "uninstall" },
            { domain: "engine-ui", name: "new-channel" },
            { domain: "engine-ui", name: "del-channel" }
          ],
          deny: []
        },
        queryPolicy: {
          allow: [
            { rid: "io.picolabs.next", name: "__testing" },
            { rid: "io.picolabs.next", name: "uiECI" },
            { rid: "io.picolabs.next", name: "box" },
            { rid: "io.picolabs.next", name: "pico" }
          ],
          deny: []
        }
      });

      return {
        async event(event) {
          switch (`${event.domain}:${event.name}`) {
            case "engine-ui:box":
              if (event.data) {
                const attrs = event.data.attrs;
                for (const key of ["x", "y", "width", "height"]) {
                  const n = parseFloat(attrs[key]);
                  if (typeof n === "number" && n === n) {
                    await ctx.putEnt(key, n);
                  }
                }
                for (const key of ["name", "backgroundColor"]) {
                  let val = attrs[key];
                  if (typeof val === "string") {
                    await ctx.putEnt(key, val.trim());
                  }
                }
              }
              return;

            case "engine-ui:new":
              const childEci = await ctx.newPico({
                rulesets: [{ rid: "io.picolabs.next", version: "0.0.0" }]
              });
              if (childEci) {
                const childEciUI = await ctx.query({
                  eci: childEci,
                  rid: "io.picolabs.next",
                  name: "uiECI",
                  args: {}
                });

                if (event.data) {
                  const attrs = event.data.attrs;
                  await ctx.event({
                    eci: childEciUI,
                    domain: "engine-ui",
                    name: "box",
                    data: { attrs },
                    time: 0 // TODO remove this typescript requirement
                  });
                }
              }
              return;

            case "engine-ui:del":
              if (event.data) {
                const attrs = event.data.attrs;
                for (const eci of ctx.pico().children) {
                  const uiEci = await ctx.query({
                    eci,
                    rid: "io.picolabs.next",
                    name: "uiECI",
                    args: {}
                  });
                  if (attrs.eci === uiEci) {
                    await ctx.delPico(eci);
                  }
                }
              }
              return;

            case "engine-ui:install":
              if (event.data) {
                const attrs = event.data.attrs;
                await ctx.install(attrs.rid, attrs.version, attrs.config);
              }
              return;

            case "engine-ui:uninstall":
              if (event.data) {
                const attrs = event.data.attrs;
                await ctx.uninstall(attrs.rid);
              }
              return;

            case "engine-ui:new-channel":
              if (event.data) {
                const attrs = event.data.attrs;
                await ctx.newChannel(attrs);
              }
              return;

            case "engine-ui:del-channel":
              if (event.data) {
                const attrs = event.data.attrs;
                await ctx.delChannel(attrs.eci);
              }
              return;
          }
        },
        query: {
          __testing() {
            return {
              queries: [
                { name: "__testing" },
                { name: "box" },
                { name: "uiECI" },
                { name: "pico" }
              ],
              events: [
                {
                  domain: "engine-ui",
                  name: "box",
                  attrs: [
                    "name",
                    "backgroundColor",
                    "x",
                    "y",
                    "width",
                    "height"
                  ]
                }
              ]
            };
          },
          async box() {
            const [name, bgColor, x, y, w, h] = await Promise.all([
              ctx.getEnt("name"),
              ctx.getEnt("backgroundColor"),

              ctx.getEnt("x"),
              ctx.getEnt("y"),
              ctx.getEnt("width"),
              ctx.getEnt("height")
            ]);

            const me = ctx.pico();

            return {
              eci: uiChannel.id,
              parent: me.parent
                ? await ctx.query({
                    eci: me.parent,
                    rid: "io.picolabs.next",
                    name: "uiECI",
                    args: {}
                  })
                : null,
              children: await Promise.all(
                me.children.map(eci => {
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
