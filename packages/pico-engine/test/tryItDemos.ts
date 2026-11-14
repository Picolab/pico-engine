/**
 * Each Try It! bootstrap ruleset sets up its whole demo on a new child pico,
 * the same steps the developer UI's Try It! tab takes, and the demo then does
 * what its cookbook page says.
 */

import test from "ava";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

type Pe = Awaited<ReturnType<typeof startIsolatedEngine>>;

interface TryItStatus {
  ready: boolean;
  stage: string;
  links: Array<{ label: string; url: string }>;
}

function uiEvent(pe: Pe, eci: string, name: string, attrs: Record<string, unknown>) {
  return pe.pf.eventWait({ eci, domain: "engine_ui", name, data: { attrs }, time: 0 });
}

function picoInfo(pe: Pe, uiEci: string) {
  return pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  }) as Promise<{
    children: string[];
    channels: Array<{ id: string; tags: string[] }>;
    rulesets: Array<{ rid: string }>;
  }>;
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

/**
 * Run a demo's bootstrap on a new child of the root pico, as the Try It! tab does.
 * With `withXmlui`, the child already has the views runtime when the bootstrap runs.
 */
async function runDemo(folder: string, rid: string, opts: { withXmlui?: boolean } = {}) {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootUi = Object.values(root.channels).find((c) => c.tags.includes("ui"))!.id;
  await uiEvent(pe, rootUi, "new", { name: rid });
  const childUi = await waitFor(async () => (await picoInfo(pe, rootUi)).children[0]);
  if (opts.withXmlui) {
    await uiEvent(pe, childUi, "install", { url: `${pe.base_url}/krl/io.picolabs.xmlui.krl` });
    await waitFor(async () =>
      (await picoInfo(pe, childUi)).rulesets.some((r) => r.rid === "io.picolabs.xmlui")
    );
  }
  await uiEvent(pe, childUi, "install", { url: `${pe.base_url}/krl/demos/${folder}/${rid}.krl` });
  const tryItEci = await waitFor(async () =>
    (await picoInfo(pe, childUi)).channels.find((c) => c.tags.includes("try_it"))?.id
  );
  const status = await waitFor(async () => {
    const s = (await pe.pf.query({ eci: tryItEci, rid, name: "tryIt", args: {} })) as TryItStatus;
    return s.ready ? s : null;
  });
  return { pe, childUi, status };
}

function eciOf(link: { url: string }): string {
  return link.url.split("/ui/")[1].split("/")[0];
}

async function pageLoads(t: any, link: { url: string }, component: string) {
  const main = await fetch(link.url + "Main.xmlui");
  t.is(main.status, 200, link.url);
  t.true((await main.text()).includes(`<${component} />`), component);
}

/** Raise an event over HTTP, as a view's APICall or curl does; returns the response body. */
async function skyEvent(pe: Pe, eci: string, domain: string, name: string, attrs: Record<string, unknown> = {}) {
  const res = await fetch(`${pe.base_url}/sky/event/${eci}/test/${domain}/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(attrs),
  });
  return (await res.json()) as { directives?: Array<{ name: string; options: any }>; error?: string };
}

function directives(resp: { directives?: Array<{ name: string; options: any }> }) {
  return resp.directives || [];
}

test("Echo: answers hello and message events with a say directive", async (t) => {
  const { pe, status } = await runDemo("echo", "com.example.echo.bootstrap");
  t.is(status.links.length, 1);
  await pageLoads(t, status.links[0], "EchoPage");
  const eci = eciOf(status.links[0]);

  const hello = await skyEvent(pe, eci, "echo", "hello");
  t.deepEqual(directives(hello).map((d) => d.options.something), ["Hello World"]);

  const message = await skyEvent(pe, eci, "echo", "message", { input: "KRL programs the Internet!" });
  t.deepEqual(directives(message).map((d) => d.options.something), ["KRL programs the Internet!"]);

  // The curl command shown on the page.
  const res = await fetch(`${pe.base_url}/sky/event/${eci}/curl/echo/message?input=hello`);
  t.is(res.status, 200);
  const body = (await res.json()) as { directives: Array<{ options: { something: string } }> };
  t.is(body.directives[0].options.something, "hello");
  await pe.pf.db.close();
});

test("Score tracker: seeded leaderboard, registration, points, and a narrow channel", async (t) => {
  const { pe, status } = await runDemo("score_tracker", "com.example.score_tracker.bootstrap");
  await pageLoads(t, status.links[0], "Leaderboard");
  const eci = eciOf(status.links[0]);
  const ranks = () =>
    pe.pf.query({ eci, rid: "com.example.score_tracker", name: "currentRanks", args: {} }) as Promise<
      Array<{ rank: number; pid: string; name: string; total: number }>
    >;

  t.deepEqual(
    (await ranks()).map((r) => [r.rank, r.name, r.total]),
    [
      [1, "Ada Lovelace", 45],
      [2, "Grace Hopper", 40],
      [3, "Alan Turing", 25],
    ]
  );

  const reg = await skyEvent(pe, eci, "score", "new_participant", { first: "Katherine", last: "Johnson" });
  const pid = directives(reg)[0].options.pid as string;
  t.truthy(pid);
  const again = await skyEvent(pe, eci, "score", "new_participant", { first: "Katherine", last: "Johnson" });
  t.is(directives(again)[0].options.pid, pid, "the same name gets the same id");

  await skyEvent(pe, eci, "score", "new_points", { pid, points: "50", descr: "Orbits" });
  t.deepEqual((await ranks())[0], { rank: 1, pid, name: "Katherine Johnson", total: 50, entries: 1 });

  const denied = await skyEvent(pe, eci, "wrangler", "new_child_request", { name: "nope" });
  t.regex(String(denied.error), /channel policy/i, "the contest channel only takes score events");
  await pe.pf.db.close();
});

test("Child tasks: each task runs in a child pico that reports back and is deleted", async (t) => {
  const { pe, childUi, status } = await runDemo("child_tasks", "com.example.task_runner.bootstrap");
  await pageLoads(t, status.links[0], "TasksPage");
  const eci = eciOf(status.links[0]);
  const tasks = () =>
    pe.pf.query({ eci, rid: "com.example.task_runner", name: "tasks", args: {} }) as Promise<
      Array<{ id: number; n: number; status: string; primes: number; worker: string }>
    >;

  const done = await waitFor(async () => {
    const list = await tasks();
    return list.length === 3 && list.every((task) => task.status === "done" && /deleted/.test(task.worker))
      ? list
      : null;
  });
  t.deepEqual(
    done.map((task) => [task.n, task.primes]).sort((a, b) => a[0] - b[0]),
    [
      [1000, 168],
      [10000, 1229],
      [30000, 3245],
    ]
  );
  t.deepEqual((await picoInfo(pe, childUi)).children, [], "every worker pico was deleted");
  await pe.pf.db.close();
});

test("Two picos: Bob asks Alice questions over their relationship", async (t) => {
  const { pe, status } = await runDemo("two_picos", "com.example.two_picos.bootstrap");
  t.is(status.links.length, 2);
  await pageLoads(t, status.links[0], "ConversationPage");
  await pageLoads(t, status.links[1], "FactsPage");
  const bob = eciOf(status.links[0]);
  const alice = eciOf(status.links[1]);
  const conversation = () =>
    pe.pf.query({ eci: bob, rid: "com.example.two_picos.asker", name: "conversation", args: {} }) as Promise<
      Array<{ question: string; answer: string }>
    >;

  const first = await waitFor(async () => {
    const c = await conversation();
    return c.length ? c : null;
  });
  t.deepEqual(first[0], { ...first[0], question: "favorite color", answer: "My favorite color is blue." });

  await pe.pf.eventWait({ eci: bob, domain: "two_picos", name: "ask", data: { attrs: { question: "cat" } }, time: 0 });
  t.is((await conversation())[1].answer, "My cat is Pixel.");

  await pe.pf.eventWait({
    eci: alice,
    domain: "two_picos",
    name: "fact_learned",
    data: { attrs: { topic: "Favorite Food", value: "pizza" } },
    time: 0,
  });
  await pe.pf.eventWait({
    eci: bob,
    domain: "two_picos",
    name: "ask",
    data: { attrs: { question: "favorite food" } },
    time: 0,
  });
  t.is((await conversation())[2].answer, "My favorite food is pizza.");
  await pe.pf.db.close();
});

test("Guard rules: five requests make one archive, and the gate refuses early notes", async (t) => {
  const { pe, childUi, status } = await runDemo("guard_rules", "com.example.archive.bootstrap");
  await pageLoads(t, status.links[0], "ArchivePage");
  const eci = eciOf(status.links[0]);
  const query = (name: string) => pe.pf.query({ eci, rid: "com.example.archive", name, args: {} }) as Promise<any>;

  const notes = await waitFor(async () => {
    const list = (await query("notes")) as Array<{ text: string }>;
    return list.length ? list : null;
  });
  t.deepEqual(
    notes.map((n) => n.text),
    ["Written after the archive was created"]
  );
  t.like(await query("status"), { archive: "ready", archive_picos: 1, requests: 5, ignored: 4, gated: 1 });
  t.is((await picoInfo(pe, childUi)).children.length, 1, "one Archive child");

  const again = await skyEvent(pe, eci, "archive", "needed");
  t.deepEqual(directives(again), [], "the guard ignores another request");
  t.like(await query("status"), { archive_picos: 1, requests: 6, ignored: 5 });

  const note = await skyEvent(pe, eci, "archive", "note_added", { text: "Second" });
  t.deepEqual(directives(note).map((d) => d.options.result), ["stored"]);

  const reset = await skyEvent(pe, eci, "archive", "reset");
  t.falsy(reset.error);
  await waitFor(async () => ((await picoInfo(pe, childUi)).children.length === 0 ? true : null));
  const early = await skyEvent(pe, eci, "archive", "note_added", { text: "No archive" });
  t.deepEqual(directives(early).map((d) => d.options.result), ["refused, no archive yet"]);
  await pe.pf.db.close();
});

test("Layered rulesets: start with the base, add one layer at a time, and each changes the answers", async (t) => {
  const { pe, childUi, status } = await runDemo("layered_rulesets", "com.example.invitations.bootstrap");
  await pageLoads(t, status.links[0], "InvitationsPage");
  const eci = eciOf(status.links[0]);
  const query = (name: string) => pe.pf.query({ eci, rid: "com.example.invitations", name, args: {} }) as Promise<any>;
  const names = (resp: { directives?: Array<{ name: string }> }) => directives(resp).map((d) => d.name);
  const full = "https://agents.example/invite?c_i=eyJsYWJlbCI6IkFkYSBMb3ZlbGFjZSJ9";
  const short = "https://short.example/alan";
  const accept = async (url: string) => names(await skyEvent(pe, eci, "invite", "new_invitation", { url }));
  const installed = async () => ((await query("layers")) as Array<{ installed: boolean }>).map((l) => l.installed);

  t.deepEqual(await installed(), [false, false], "the bootstrap installs only the base");
  t.deepEqual(await query("connections"), []);
  t.deepEqual(await accept(full), ["connected"]);
  t.deepEqual(await accept(short), [], "no rule selects a short link yet");

  t.deepEqual(names(await skyEvent(pe, eci, "layers", "next_layer_requested")), ["add_next_layer"]);
  t.deepEqual(await installed(), [true, false]);
  t.deepEqual(await accept(short), ["expanded", "connected"]);
  t.deepEqual(await accept(full), ["connected"]);

  t.deepEqual(names(await skyEvent(pe, eci, "layers", "next_layer_requested")), ["add_next_layer"]);
  t.deepEqual(await installed(), [true, true]);
  t.deepEqual(await accept(short), ["expanded", "connected", "welcome"]);
  t.deepEqual(await accept(full), ["connected", "welcome"]);
  t.deepEqual(await accept("https://short.example/nobody"), []);
  t.deepEqual(names(await skyEvent(pe, eci, "layers", "next_layer_requested")), [], "nothing left to add");

  await uiEvent(pe, childUi, "uninstall", { rid: "com.example.invitations.short_links" });
  t.deepEqual(await installed(), [false, true]);
  t.deepEqual(await accept(short), []);
  t.deepEqual(await accept(full), ["connected", "welcome"]);
  const denied = await skyEvent(pe, eci, "wrangler", "install_ruleset_request", { url: "file:///etc/passwd" });
  t.regex(String(denied.error), /channel policy/i, "the page's channel can't install arbitrary rulesets");
  await pe.pf.db.close();
});

/** A new channel that takes any event, on the child named `name`, as someone would pick on the Testing tab. */
async function testingEciOf(pe: Pe, parentUi: string, name: string) {
  for (const childUi of (await picoInfo(pe, parentUi)).children) {
    const box = (await pe.pf.query({ eci: childUi, rid: "io.picolabs.pico-engine-ui", name: "box", args: {} })) as {
      name: string;
    };
    if (box.name === name) {
      await uiEvent(pe, childUi, "new_channel", {
        tags: ["testing"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: { allow: [], deny: [] },
      });
      return (await picoInfo(pe, childUi)).channels.find((c) => c.tags.includes("testing"))!.id;
    }
  }
  throw new Error(`no child named ${name}`);
}

test("Collection: members join by role, a stranger is turned away, and members leave and rejoin", async (t) => {
  const { pe, childUi, status } = await runDemo("collection", "com.example.collection.bootstrap");
  await pageLoads(t, status.links[0], "ReportPage");
  const eci = eciOf(status.links[0]);
  const query = (name: string) =>
    pe.pf.query({ eci, rid: "com.example.collection.report", name, args: {} }) as Promise<any>;
  const roomNames = async () =>
    ((await query("report")).members as Array<{ name: string }>).map((m) => m.name).sort();

  const report = await query("report");
  t.is(report.count, 4);
  t.is(report.average, 69.5);
  t.deepEqual(await roomNames(), ["Bedroom", "Garage", "Kitchen", "Office"]);
  t.like((await query("rejections"))[0], { name: "Stranger", role: "visitor" });

  const kitchen = report.members.find((m: { name: string }) => m.name === "Kitchen");
  await skyEvent(pe, eci, "collection", "member_removal_requested", { Id: kitchen.Id });
  await waitFor(async () => ((await query("report")).count === 3 ? true : null));

  const office = await testingEciOf(pe, childUi, "Office");
  const send = (domain: string, name: string, attrs: Record<string, unknown> = {}) =>
    pe.pf.eventWait({ eci: office, domain, name, data: { attrs }, time: 0 });
  await send("collection", "leave_requested");
  await waitFor(async () => ((await query("report")).count === 2 ? true : null));
  t.deepEqual(await roomNames(), ["Bedroom", "Garage"]);

  await send("room", "new_temperature", { temperature: "80" });
  await send("collection", "rejoin_requested");
  const back = await waitFor(async () => {
    const r = await query("report");
    return r.count === 3 ? r : null;
  });
  t.like(
    back.members.find((m: { name: string }) => m.name === "Office"),
    { temperature: 80 }
  );
  await pe.pf.db.close();
});

test("Secrets: the notifier is idle until configured, posts with the secret URL, and never shares it", async (t) => {
  const { pe, childUi, status } = await runDemo("secrets", "com.example.notifier.bootstrap");
  t.is(status.links.length, 2);
  await pageLoads(t, status.links[0], "NotifierPage");
  await pageLoads(t, status.links[1], "InboxPage");
  const notifier = eciOf(status.links[0]);
  const inboxEci = eciOf(status.links[1]);
  const notifierQuery = (name: string) =>
    pe.pf.query({ eci: notifier, rid: "com.example.notifier", name, args: {} }) as Promise<any>;
  const hookQuery = (name: string) =>
    pe.pf.query({ eci: inboxEci, rid: "com.example.hook_service", name, args: {} }) as Promise<any>;

  const inbox = await waitFor(async () => {
    const list = (await hookQuery("inbox")) as Array<{ text: string }>;
    return list.length ? list : null;
  });
  t.deepEqual(
    inbox.map((m) => m.text),
    ["Hello from the notifier"]
  );
  const state = await notifierQuery("status");
  t.like(state, { configured: true, not_sent: 1 });
  t.regex(state.webhook, /token=\(hidden\)$/);
  t.like((await notifierQuery("deliveries"))[0], { text: "Hello from the notifier", status: 200 });

  const sent = await skyEvent(pe, notifier, "notifier", "message", { text: "Second" });
  t.falsy(sent.error);
  await waitFor(async () => ((await hookQuery("inbox")).length === 2 ? true : null));

  const changed = await skyEvent(pe, notifier, "notifier_config", "new_webhook", { webhook_url: "https://evil.example/" });
  t.regex(String(changed.error), /channel policy/i, "the page's channel cannot change the webhook");

  const hookPico = (await picoInfo(pe, childUi)).children[0];
  const webhook = (await picoInfo(pe, hookPico)).channels.find((c) => c.tags.includes("webhook"))!.id;
  const wrong = await skyEvent(pe, webhook, "hook", "post", { token: "guess", text: "Let me in" });
  t.deepEqual(directives(wrong).map((d) => d.name), ["refused"]);
  t.is(await hookQuery("refused"), 1);
  await pe.pf.db.close();
});

test("Bootstrap and channels: installs in order, configures, and keeps one channel", async (t) => {
  const { pe, status } = await runDemo("bootstrap", "com.example.visitors.bootstrap");
  await pageLoads(t, status.links[0], "VisitorsPage");
  const eci = eciOf(status.links[0]);
  const setup = () =>
    pe.pf.query({ eci, rid: "com.example.visitors", name: "setup", args: {} }) as Promise<{
      rulesets: Array<{ rid: string }>;
      config: string;
      channels: Array<{ id: string; events: string; this_page: string }>;
    }>;
  const names = (resp: { directives?: Array<{ name: string }> }) => directives(resp).map((d) => d.name);

  const first = await setup();
  const rids = first.rulesets.map((r) => r.rid);
  t.true(rids.indexOf("com.example.visitors.format") < rids.indexOf("com.example.visitors"), "the module first");
  t.is(first.config, JSON.stringify({ greeting: "Welcome" }));
  t.is(first.channels.length, 1);
  t.like(first.channels[0], { id: eci, this_page: "yes" });
  t.false(first.channels[0].events.includes("wrangler"), "the install event is not on the app channel");
  t.false(first.channels[0].events.includes("visitor_setup"), "nor the event the ruleset raises for itself");
  t.true(first.channels[0].events.includes("visitor:arrived"));

  const greeted = await skyEvent(pe, eci, "visitor", "arrived", { name: "Ada" });
  t.is(directives(greeted)[0].options.message, "Welcome, Ada!");

  t.deepEqual(names(await skyEvent(pe, eci, "visitor_channel", "check_requested")), ["set_up_channel"]);
  t.deepEqual((await setup()).channels.map((c) => c.id), [eci], "updated in place, same id");

  await skyEvent(pe, eci, "visitor_channel", "duplicate_requested");
  await skyEvent(pe, eci, "visitor_channel", "duplicate_requested");
  t.is((await setup()).channels.length, 3, "the naive way piles up channels");
  t.deepEqual(names(await skyEvent(pe, eci, "visitor_channel", "cleanup_requested")), [
    "clean_up_channels",
    "clean_up_channels",
  ]);
  t.deepEqual((await setup()).channels.map((c) => c.id), [eci], "cleanup keeps the channel in use");

  const denied = await skyEvent(pe, eci, "wrangler", "install_ruleset_request", { url: "file:///etc/hosts" });
  t.regex(String(denied.error), /channel policy/i);
  const internal = await skyEvent(pe, eci, "visitor_setup", "channel_missing");
  t.regex(String(internal.error), /channel policy/i);
  await pe.pf.db.close();
});

test("KBlog: readers read, authors post through the event hierarchy, and nobody skips the check", async (t) => {
  const { pe, status } = await runDemo("kblog", "com.example.kblog.bootstrap");
  t.is(status.links.length, 2);
  const reader = eciOf(status.links[0]);
  const author = eciOf(status.links[1]);
  await pageLoads(t, { url: status.links[0].url }, "HomePage");
  const articles = (eci: string) =>
    pe.pf.query({ eci, rid: "com.example.kblog", name: "articles", args: {} }) as Promise<
      Array<{ id: number; title: string; author: string; latest: boolean }>
    >;
  const names = (resp: { directives?: Array<{ name: string }> }) => directives(resp).map((d) => d.name);

  const seeded = await articles(reader);
  t.deepEqual(
    seeded.map((a) => a.title),
    ["Code Monkey was here", "Rulesets in layers", "Event hierarchies"]
  );
  t.true(seeded[0].latest);

  const postComponent = (eci: string) =>
    fetch(`${pe.base_url}/ui/${eci}/com.example.kblog/components/PostPage.xmlui`).then((r) => r.status);
  t.not(await postComponent(reader), 200, "the reader channel cannot open the Post page");
  t.is(await postComponent(author), 200);
  const form = await fetch(`${pe.base_url}/ui/${author}/com.example.kblog/components/PostForm.xmlui`);
  t.is(form.status, 200, "the posting ruleset's component loads on the author channel");

  const readerPost = await skyEvent(pe, reader, "kblog", "post_submitted", { author: "Mallory", title: "Hi" });
  t.regex(String(readerPost.error), /channel policy/i);

  const posted = await skyEvent(pe, author, "kblog", "post_submitted", {
    author: "Ada",
    title: "Notes on the engine",
    body: "It *raises events*.",
  });
  t.deepEqual(names(posted), ["handle_submit", "add_article", "show_new_article"]);
  const after = await articles(reader);
  t.like(after[0], { id: 4, title: "Notes on the engine", author: "Ada", latest: true });
  t.like(await pe.pf.query({ eci: reader, rid: "com.example.kblog", name: "article", args: { id: "4" } }), {
    body: "It *raises events*.",
  });

  t.deepEqual(names(await skyEvent(pe, author, "kblog", "post_submitted", { author: "Ada", title: "  " })), [
    "reject_submit",
  ]);
  const skip = await skyEvent(pe, author, "kblog", "new_article_available", { author: "Ada", title: "Unchecked" });
  t.regex(String(skip.error), /channel policy/i, "authors cannot skip handle_submit");

  t.deepEqual(names(await skyEvent(pe, author, "kblog", "clear_requested")), ["clear_articles", "show_empty_blog"]);
  t.deepEqual(await articles(reader), []);
  await pe.pf.db.close();
});

test("Querying JSON: the canned queries, your own query, and a bad path", async (t) => {
  const { pe, status } = await runDemo("json_query", "com.example.json_query.bootstrap");
  t.is(status.links.length, 1);
  await pageLoads(t, status.links[0], "QueryPage");
  const eci = eciOf(status.links[0]);
  const run = async (path: string) => {
    const res = await fetch(
      `${pe.base_url}/sky/query/${eci}/com.example.json_query/runQuery?path=${encodeURIComponent(path)}`
    );
    return (await res.json()) as { count?: number; result?: any[]; error?: string };
  };

  const canned = (await pe.pf.query({ eci, rid: "com.example.json_query", name: "cannedQueries", args: {} })) as Array<{
    path: string;
  }>;
  t.is(canned.length, 4);
  const [names, miles, business, fillups] = await Promise.all(canned.map((q) => run(q.path)));
  t.deepEqual(names.result, ["Work truck", "Family car", "Commuter"]);
  t.deepEqual(miles.result, [42.6, 3.1, 118.4, 12, 27.5, 31.2]);
  t.deepEqual(
    business.result!.map((trip) => trip.miles),
    [42.6, 118.4, 27.5, 31.2]
  );
  t.deepEqual(fillups.result, [
    { date: "2026-11-06", gallons: 19.8, price: 3.29 },
    { date: "2026-11-03", gallons: 8.4, price: 3.35 },
  ]);
  t.is(fillups.count, 2);

  t.deepEqual((await run("$.owner.email")).result, ["ada@example.com"]);
  t.regex(String((await run("$.vehicles[?@.miles >")).error), /query: /);
  const data = await fetch(`${pe.base_url}/sky/query/${eci}/com.example.json_query/fleetData`).then((r) => r.json());
  t.is(data.vehicles.length, 3);
  const denied = await skyEvent(pe, eci, "wrangler", "install_ruleset_request", { url: "file:///etc/hosts" });
  t.regex(String(denied.error), /channel policy/i);
  await pe.pf.db.close();
});

test("A pico that already has the views runtime: the bootstraps go straight to the app", async (t) => {
  for (const [folder, rid, app] of [
    ["echo", "com.example.echo.bootstrap", "com.example.echo"],
    ["bootstrap", "com.example.visitors.bootstrap", "com.example.visitors"],
  ]) {
    const { pe, childUi, status } = await runDemo(folder, rid, { withXmlui: true });
    t.true((await picoInfo(pe, childUi)).rulesets.some((r) => r.rid === app), app);
    t.is(status.links.length, 1, folder);
    await pe.pf.db.close();
  }
});
