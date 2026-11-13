/**
 * io.picolabs.pds keeps exactly one pds channel per pico: made when PDS is
 * installed, and on the root pico at engine start if it is missing.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

type Pe = Awaited<ReturnType<typeof startIsolatedEngine>>;

async function pdsChannels(pe: Pe, uiEci: string) {
  const info = (await pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  })) as { children: string[]; channels: Array<{ id: string; tags: string[] }> };
  return { children: info.children, pds: info.channels.filter((c) => c.tags.join(",") === "pds") };
}

async function waitFor<T>(fn: () => Promise<T | null | undefined | false>, ms = 20000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 100));
  }
}

test("one pds channel on the root and on a new child, and engine:started doesn't add another", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootUi = Object.values(root.channels).find((c) => c.tags.includes("ui"))!.id;

  const rootPds = await waitFor(async () => {
    const { pds } = await pdsChannels(pe, rootUi);
    return pds.length ? pds : null;
  });
  t.is(rootPds.length, 1, "the root pico has a pds channel");
  const rootTags = (
    (await pe.pf.query({ eci: rootUi, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} })) as {
      channels: Array<{ tags: string[] }>;
    }
  ).channels.map((c) => c.tags.join(","));
  t.true(rootTags.includes("wellknown_rx,tx_rx"), "engine:started reaches io.picolabs.subscription on the root too");

  await pe.pf.eventWait({ eci: rootUi, domain: "engine", name: "started", data: { attrs: {} }, time: 0 });
  t.is((await pdsChannels(pe, rootUi)).pds.length, 1, "starting again finds the channel instead of adding one");

  await pe.pf.eventWait({ eci: rootUi, domain: "engine_ui", name: "new", data: { attrs: { name: "Child" } }, time: 0 });
  const childUi = await waitFor(async () => (await pdsChannels(pe, rootUi)).children[0]);
  const childPds = await waitFor(async () => {
    const { pds } = await pdsChannels(pe, childUi);
    return pds.length ? pds : null;
  });
  t.is(childPds.length, 1, "a new child has one pds channel");

  const eci = (await pe.pf.query({
    eci: rootPds[0].id,
    rid: "io.picolabs.pds",
    name: "profile",
    args: {},
  })) as { status: string };
  t.is(eci.status, "success", "the pds channel allows PDS queries");
  await pe.pf.db.close();
});
