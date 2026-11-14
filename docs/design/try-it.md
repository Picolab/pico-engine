# "Try It!" demos

Status: implemented, twelve demos (Echo, Score tracker, Thermostat, Two picos talking, Child pico tasks, Guard rules, Layered rulesets, Collection, Configuration and secrets, Bootstrap and channels, KBlog, Querying JSON). Owner: engine + developer UI.

## Goal

Someone who has just installed pico-engine, or an agent pointed at it, should be able to pick a worked example and see it running in a minute, then read how it was built. The examples are the [cookbook](../cookbook/README.md) demos.

## A demo is a bootstrap ruleset

Each runnable demo has one **bootstrap ruleset** beside the rest of its KRL: `demos/<folder>/<rid>.bootstrap.krl`. Installed on a fresh pico, it sets up the whole demo the way any pico would, with wrangler events and callbacks: it installs the other rulesets, creates children, makes relationships, and seeds data. It never uses `ctx:` or `schedule` to wait for work to finish.

| Bootstrap ruleset must | Why |
|------------------------|-----|
| Name the demo in `meta name` and say what it shows in `meta description` | The "Try It!" tab lists demos from these, so there is no separate manifest |
| Share `tryIt()`, returning `{ ready, stage, links: [{ label, url }] }` | The tab shows progress and the links to open, the same way for every demo |
| Create a channel tagged `try_it` that allows `tryIt` | The tab reads `tryIt` through it. The developer UI channel does not allow arbitrary queries |
| Install sibling rulesets with `wrangler:install_ruleset_request` and `absoluteURL: meta:rulesetURI`; install engine rulesets from `meta:host + "/krl/…"` | Both resolve to files the engine ships, so a demo works offline |
| Not `use module` a ruleset it installs | A module must be installed before a ruleset that uses it. Find channels by tag through wrangler instead |

Views are part of a demo where seeing it helps: the bootstrap's `links` point at them.

Demos that cannot run on one engine (moving picos needs two engines and Manifold) have no bootstrap ruleset. They stay guided: the cookbook instructions walk through them.

## The engine ships the demos

- The npm package includes `demos/` (copied from the repository root at pack time, like the MCP docs).
- `GET /krl/demos/<path>.krl` serves a demo file. A ruleset installed from that URL is read from the local file, like the engine's own `/krl/` rulesets, so `meta:rulesetURI` and sibling installs work offline.
- `GET /api/try-it` lists every `*.bootstrap.krl` under `demos/`: `rid`, `name`, `description`, `url` (on this engine), `path` (absolute, on the engine's machine), `docs` (the cookbook page for its folder), and `files` (every `.krl` in its folder, with `rid`, `url`, and `path`). `notes` is the text of `demos/<folder>/try-it.md`, shown in the demo's window as **What to look for and try**: paragraphs and `- ` lists with `` `code` `` and `**bold**`, rendered as text (no HTML). The list follows `demos/try-it-order.json`, a JSON array of folder names. Folders it doesn't name come after, by path.

The engine knows nothing about what a demo does. It serves files and lists them.

## The "Try It!" tab

A tab in the developer UI. Engine config `show_tryit_menu` (env `PICO_ENGINE_SHOW_TRYIT_MENU`) decides where it appears:

| Value | Tab appears on |
|-------|----------------|
| `off` | No pico. `GET /api/try-it` lists no demos |
| `root_only` (default) | The root pico only |
| `all` | Every pico |

`GET /api/ui-context` reports the value as `showTryItMenu`.

The tab is a list of demos, each with its `meta name` and `description` and how many are running under this pico. Clicking one opens a modal:

- **Run** creates a child of this pico named after the demo (`engine_ui:new`), then installs the bootstrap ruleset on the child (`engine_ui:install`). Everything else is the bootstrap's job.
- **Running here** lists this pico's children running that demo (they have a `try_it` channel), with each one's `tryIt()` stage and links, and **Delete Child**, which deletes the child pico (`engine_ui:del`).
- **The code** lists the bootstrap ruleset and every demo file a running copy installed. Each shows its absolute path on the engine's machine (with Copy), its source, and **Flush** on each running copy that has it (`engine_ui:flush`). The modal says why: these files ship with the engine, so edit one, flush it, and reload the view to see the change.

A demo always runs in a new child, so it never changes a pico someone already uses. State lives in the picos, so the tab shows the same thing after a reload.

Edits are for experimenting. The demos are maintained in the repository's `demos/`, and changes come in as pull requests. An npm install's copy may not be writable and is replaced on upgrade, and that's fine. `PICO_ENGINE_DEMOS_DIR` points the engine at another directory to serve as `demos/` (the tests use it, and so can a contributor running an installed engine against a checkout).

## OAuth meshes

Not supported, on purpose. The demo pages don't include `PicoAccessTokenField`, and the docs' `curl` examples send no bearer, so on a mesh with OAuth turned on the pages may not load data. The tab checks `/api/oauth/mesh-enabled` and shows a warning when it is.

## Agents

The dev MCP server (`pico-engine mcp --stdio`, `mcp/tryItTools.js`) has three tools that take the tab's steps:

- `list_try_it_demos`: `/api/try-it`, summarized: name, folder, bootstrap rid, what it shows, `try-it.md` notes, cookbook URL and MCP resource URIs, files.
- `run_try_it_demo {demo, parentEci?, name?, timeoutSeconds?}`: `demo` is a folder, bootstrap rid, or name. Creates the child under the parent's UI channel (default root), installs the bootstrap with `engine_ui:install` (reporting `ruleset_install_failed`), then polls `tryIt()` on the child's `try_it` channel until ready. Returns the child's UI ECI, the `try_it` ECI, stage, links, and the notes. Removing a demo is `delete_pico` on that UI ECI.
- `try_it_status {parentEci?}`: the "Running here" list for a pico's children.

The cookbook and Patterns and tips pages are MCP resources (`pico://docs/cookbook/<folder>/README` and `/instructions`, `pico://docs/patterns_and_tips/<page>`), read from the repo in a checkout and from `mcp/docs/` (bundled at pack time) in an npm install. Test: `test/mcpTryIt.ts`, in `npm run test:mcp`.

## Testing

`test/tryIt.ts` (`npm run test:try-it`) lists the demos, runs the Thermostat bootstrap on a child, waits for `tryIt().ready`, and loads the view it links to. It checks `show_tryit_menu`, and the edit-flush loop the modal teaches: on a copy of `demos/` (`PICO_ENGINE_DEMOS_DIR`), it edits the thermostat's default threshold, flushes, and sees the new value. `test/tryItDemos.ts` (also in `test:try-it`) runs each of the other bootstraps on a child of the root, waits for ready, and exercises the demo over HTTP. Each new bootstrap ruleset gets a run test there.

## First demo: Thermostat

`demos/xmlui/com.example.thermostat.bootstrap.krl`:

1. On its own install: create the `try_it` channel and install `io.picolabs.xmlui` from the engine.
2. When `io.picolabs.xmlui` is installed: install `com.example.thermostat` beside it.
3. When `com.example.thermostat` is installed: raise three `thermostat:new_reading` events.
4. `tryIt()` is ready when the thermostat's viewer and admin channels exist; its links open the dashboard on each.

## The other demos

They follow the same shape: create the `try_it` channel, install `io.picolabs.xmlui` if it is missing, install the app beside it, seed, and set the stage to ready.

| Folder | Bootstrap | What it sets up |
|--------|-----------|-----------------|
| `demos/echo/` | `com.example.echo.bootstrap` | `com.example.echo`: two rules that answer with a `say` directive |
| `demos/score_tracker/` | `com.example.score_tracker.bootstrap` | `com.example.score_tracker`, then three contestants (a `foreach` with `on final` raising the next step) and their points |
| `demos/child_tasks/` | `com.example.task_runner.bootstrap` | `com.example.task_runner`, then three tasks. Each task runs on a new child that the runner gives `com.example.task_worker`; the worker reports and raises `wrangler:ready_for_deletion` |
| `demos/two_picos/` | `com.example.two_picos.bootstrap` | Two children, Alice (answerer) and Bob (asker), each with `io.picolabs.xmlui` and its role ruleset. When both report `child_ready`, it sends Bob Alice's `wellKnown_Rx`; the demo is ready when Bob's relationship is added. Its links come from `wrangler:picoQuery` on each child's channels |
| `demos/guard_rules/` | `com.example.archive.bootstrap` | `com.example.archive`, then five `archive:needed` events and an early note in one `foreach`. The archive keeper installs `com.example.archive_store` on its Archive child itself |
| `demos/layered_rulesets/` | `com.example.invitations.bootstrap` | Only the base `com.example.invitations`. Its page adds the two add-ons one at a time with `layers:next_layer_requested`, a demo-only rule in the base that installs the next listed add-on from the same folder |
| `demos/collection/` | `com.example.collection.bootstrap` | A Rooms child with `io.picolabs.xmlui`, the collection, and the report; then five room children, each sent its install request and then `collection:join_requested`. Relies on each pico handling events in arrival order, so the rulesets that need no callback stay demo-agnostic. Ready when the collection has four members and one rejection, read with `wrangler:picoQuery` after checking `installedRIDs` (a query for a ruleset that isn't installed yet fails the whole `tryIt` query) |
| `demos/secrets/` | `com.example.notifier.bootstrap` | `com.example.notifier` here and a Hook service child with `com.example.hook_service`, installed with `config: {token}`. The hook service sends its webhook URL to its parent, which sends one message, configures the notifier, and sends another |
| `demos/bootstrap/` | `com.example.visitors.bootstrap` | `io.picolabs.xmlui`, then `com.example.visitors.format`, then `com.example.visitors` with `config: {greeting}`, each on the previous one's `ruleset_installed`. The app creates or updates its channel on install, with a policy built from its schema |
| `demos/kblog/` | `com.example.kblog.bootstrap` | `com.example.kblog.config`, `.data`, the pages `com.example.kblog`, and `.posting`, each on the previous one's `ruleset_installed` (the pages use config and data as modules). The pages create the reader channel and posting creates the author channel; then three `kblog:post_submitted` events. Its links open the blog on each channel |
| `demos/json_query/` | `com.example.json_query.bootstrap` | `com.example.json_query`: fleet data in a global, `cannedQueries()`, and `runQuery(path)`, which calls `query()`. Its page sends the path with `DataSource` `queryParams` so it is URL-encoded |
