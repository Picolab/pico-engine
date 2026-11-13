"use strict";

// Try It! for agents: the same steps the developer UI's Try It! tab takes.

const { z } = require("zod");
const { jsonText } = require("./engineClient");
const { findWranglerEvent } = require("./devTools");

const UI_RID = "io.picolabs.pico-engine-ui";
const OAUTH_NOTE =
  "The demos are meant for an engine without OAuth: on a mesh with OAuth turned on they install, but their pages and curl examples send no access token, so they may not load data.";

function textResult(text, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function resourceUris(folder) {
  return {
    overview: `pico://docs/cookbook/${folder}/README`,
    instructions: `pico://docs/cookbook/${folder}/instructions`,
  };
}

function summarize(demo) {
  return {
    name: demo.name || demo.rid,
    folder: demo.folder,
    bootstrapRid: demo.rid,
    shows: demo.description,
    whatToLookForAndTry: demo.notes || null,
    cookbook: demo.docs,
    resources: resourceUris(demo.folder),
    files: (demo.files || []).map((f) => ({ rid: f.rid, file: f.file, url: f.url, path: f.path })),
  };
}

function findDemo(demos, wanted) {
  const w = wanted.trim().toLowerCase();
  return demos.find(
    (d) =>
      d.folder.toLowerCase() === w ||
      d.rid.toLowerCase() === w ||
      String(d.name || "").toLowerCase() === w
  );
}

async function box(client, uiEci) {
  return client.channelQuery(uiEci, UI_RID, "box", {});
}

/** A child of a pico running a demo (it has a try_it channel and a demo's bootstrap), or null. */
async function runningDemo(client, childUiEci, demos) {
  const info = await client.channelQuery(childUiEci, UI_RID, "pico", {});
  const channel = ((info && info.channels) || []).find((c) => (c.tags || []).includes("try_it"));
  if (!channel) return null;
  const rulesets = (info && info.rulesets) || [];
  const demo = demos.find((d) => rulesets.some((rs) => rs.rid === d.rid));
  if (!demo) return null;
  const name = ((await box(client, childUiEci)) || {}).name || demo.rid;
  let status = null;
  let error;
  try {
    status = await client.channelQuery(channel.id, demo.rid, "tryIt", {});
  } catch (err) {
    error = String(err);
  }
  return {
    demo: demo.name || demo.rid,
    folder: demo.folder,
    picoName: name,
    uiEci: childUiEci,
    tryItEci: channel.id,
    ready: !!(status && status.ready),
    stage: status ? status.stage : undefined,
    links: status ? status.links || [] : [],
    error,
  };
}

function registerTryItTools(server, client) {
  server.tool(
    "list_try_it_demos",
    "List the Try It! demos that ship with this engine, in the order the developer UI shows them: what each shows, what to look for and try, its cookbook page (also an MCP resource), and its files. " +
      OAUTH_NOTE,
    {},
    async () => {
      try {
        const { show, demos } = await client.getTryIt();
        return textResult(
          jsonText({
            show,
            hint:
              show === "off"
                ? "show_tryit_menu is off on this engine, so no demos are listed."
                : "Run one with run_try_it_demo, passing its folder.",
            demos: (demos || []).map(summarize),
          })
        );
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "run_try_it_demo",
    "Run a Try It! demo the way the developer UI does: create a child pico, install the demo's bootstrap ruleset on it, and wait until its tryIt() reports ready. Returns the child's UI ECI, the links to open (pages on their channels), and what to look for and try. Remove the demo afterwards with delete_pico on the returned uiEci. " +
      OAUTH_NOTE,
    {
      demo: z.string().describe("The demo's folder (such as echo or collection), bootstrap rid, or name"),
      parentEci: z
        .string()
        .optional()
        .describe("UI ECI of the pico to create the child under; default the root pico"),
      name: z.string().optional().describe("Name for the new child pico; default the demo's name"),
      timeoutSeconds: z.number().int().min(1).max(300).optional().describe("How long to wait for ready; default 60"),
    },
    async ({ demo, parentEci, name, timeoutSeconds }) => {
      try {
        const { demos } = await client.getTryIt();
        const found = findDemo(demos || [], demo);
        if (!found) {
          return textResult(
            `No demo "${demo}". Folders: ${(demos || []).map((d) => d.folder).join(", ") || "(none; is show_tryit_menu off?)"}`,
            true
          );
        }
        const parent = parentEci || (await client.resolveUiEci());
        const before = new Set(((await box(client, parent)) || {}).children || []);
        const childName = name || found.name || found.rid;
        await client.channelEventWait(parent, "engine_ui", "new", {
          name: childName,
          backgroundColor: "#c8e6c9",
        });
        let child;
        for (let i = 0; i < 50 && !child; i++) {
          child = (((await box(client, parent)) || {}).children || []).find((c) => !before.has(c));
          if (!child) await sleep(200);
        }
        if (!child) return textResult("The new child pico did not appear.", true);

        const installed = await client.channelEventWait(child, "engine_ui", "install", { url: found.url });
        const failed = findWranglerEvent(installed, "ruleset_install_failed");
        if (failed) {
          return textResult(
            jsonText({ error: "The bootstrap ruleset did not install.", details: failed, uiEci: child }),
            true
          );
        }

        const deadline = Date.now() + (timeoutSeconds || 60) * 1000;
        let state = null;
        while (Date.now() < deadline) {
          state = await runningDemo(client, child, [found]);
          if (state && state.ready) break;
          await sleep(500);
        }
        const ready = !!(state && state.ready);
        return textResult(
          jsonText({
            ...(state || { demo: found.name || found.rid, folder: found.folder, uiEci: child, ready: false }),
            whatToLookForAndTry: found.notes || null,
            cookbook: found.docs,
            resources: resourceUris(found.folder),
            hint: ready
              ? "Open the links, or use query and raise_event on the channel ids in them (the segment after /ui/)."
              : "Not ready yet. Check again with try_it_status; the stage says how far it got.",
          }),
          !ready
        );
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "try_it_status",
    "The Try It! demos running in a pico's children, with each one's progress and links (the developer UI's \"Running here\").",
    {
      parentEci: z.string().optional().describe("UI ECI of the parent pico; default the root pico"),
    },
    async ({ parentEci }) => {
      try {
        const { demos } = await client.getTryIt();
        const parent = parentEci || (await client.resolveUiEci());
        const running = [];
        for (const child of ((await box(client, parent)) || {}).children || []) {
          const state = await runningDemo(client, child, demos || []);
          if (state) running.push(state);
        }
        return textResult(jsonText({ parentEci: parent, running }));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );
}

module.exports = { registerTryItTools, findDemo };
