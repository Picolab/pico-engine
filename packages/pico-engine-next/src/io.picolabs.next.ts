import {
  Ruleset,
  RulesetInstance,
  RulesetContext,
  ChannelConfig,
  ChannelReadOnly
} from "pico-framework";

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

export const rsNext: Ruleset = {
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
          { domain: "engine-ui", name: "del-channel" },
          { domain: "engine", name: "started" }
        ],
        deny: []
      },
      queryPolicy: {
        allow: [
          { rid: "*", name: "__testing" },
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
              rulesets: [{ rs: rsNext }]
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
              throw "TODO ctx:install";
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
                attrs: ["name", "backgroundColor", "x", "y", "width", "height"]
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
};
