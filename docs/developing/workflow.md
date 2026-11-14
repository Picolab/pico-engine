# Programming Workflow

A suggested workflow for new pico developers. Programming picos uses a small tool chain, used more or less in sequence. This page is organized by its stages:

```
Develop  →  Build  →  Deploy  →  Test  →  Release
 editor     krl-check   install    Testing tab   host at a
 + Git      + hook      + flush    + Logging     stable URL
```

The loop you'll spend most of your time in is Develop → Build → Deploy (flush) → Test. Release only matters when someone other than you depends on the ruleset.

## Develop

Use Git (or any version control) and your favorite editor. A KRL ruleset is a plain text file, by convention named after its ruleset id with a `.krl` extension.

```sh
mkdir myproject
cd myproject
git init
```

Create a ruleset file in the repository, for example `io.picolabs.hello_world.krl`. Editors don't need special support, but KRL is close enough to JavaScript that syntax highlighting for JavaScript is a reasonable fallback.

Write `/** … */` doc comments on your rules and shared functions, using the `@attr`, `@param`, and `@example` tags. The compiler turns them into the ruleset's *schema*, which the **Testing** tab uses to build forms. They don't change what the ruleset does. The [Quickstart](/lessons/quickstart) shows an example.

## Build

"Building" a ruleset means making sure it parses and compiles. Use `krl-check`, which ships with `krl-compiler`:

```sh
npm install -g krl-compiler
krl-check my.ruleset.krl
```

`krl-check` parses and compiles the file, and also lints doc comments and views. It exits with status 1 when there is an error, and prints warnings to stderr. With no file argument it reads standard input. `--json` prints a machine-readable result.

> **Note:** `krl-check` replaces the old parse-only hook scripts (`krl-compiler --verify`, and the hooks built on the old parser). If you still have one of those in a repository, replace it.

Run it often, from your editor or a file watcher. To make sure nothing that fails to compile is ever committed, add a Git pre-commit hook. [Hosting and checking rulesets](/patterns_and_tips/hosting-and-checking-rulesets) has the hook, and it checks the *staged* version of each file, which is what you want.

Then add and commit as usual:

```sh
git add io.picolabs.hello_world.krl
git commit -m "initial commit"
```

With the hook in place, a ruleset that commits is one that compiles. (It doesn't promise the rules do what you want. That's the Test stage.)

## Deploy

Deploying means installing the ruleset in each pico that needs it. If it's already installed, you only need to flush it.

### Install

Open the developer UI at <http://localhost:3000> (port 3000 is the default), click the pico, and use the **Rulesets** tab's **Install Ruleset by URL** form. You need the ruleset's URL:

- **Local file.** While developing on the same machine as the engine, use `file://` followed by the full path. The path starts with a slash, so you end up with three slashes: `file:///Users/you/myproject/io.picolabs.hello_world.krl`. The **Browse…** button stages a *copy* of the file, which is convenient for a first install but is not reread by a later flush; type the `file:///` URL yourself if you want flush to see your edits.
- **GitHub.** Use the *raw* URL, `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>.krl`, not the page GitHub shows. GitHub caches raw files for a few minutes, so a change you just pushed may not be visible right away.
- **The engine's own rulesets and demos.** `http://localhost:3000/krl/<rid>.krl` and `/krl/demos/…`.

When the engine can't compile the ruleset, the install fails and the UI shows the error with its line and column.

### Flush

The engine compiles a ruleset once and keeps the result. After you change the source, **flush** it so the engine fetches the URL and compiles it again. On the **Rulesets** tab, click **flush** next to the ruleset. Flushing is per URL: every pico on this engine that has the ruleset installed from that URL gets the new version. The ruleset's hash changes with each new version of the source.

You can also flush from KRL, which is handy in scripts:

```krl
raise wrangler event "rulesets_need_flushing"
```

That re-fetches and recompiles every ruleset installed in the pico, and then raises `wrangler:rulesets_flushed`.

Flushing doesn't raise `wrangler:ruleset_installed`, so a rule that initializes the ruleset on install doesn't run again. If you changed what that rule sets up, run it yourself (or reinstall in a fresh pico). If a ruleset doesn't compile, the flush fails with the same kind of error you see on install.

## Test

The **Testing** tab sends events and queries to the pico without you building URLs. Choose a channel (ECI) and a ruleset. The forms come from the ruleset's schema, so the doc comments you wrote in the Develop stage become the form fields and presets. The tab keeps a history so you can send the same thing again. See [Events and Queries](/lessons/events-and-queries) for a walk-through.

The **Logging** tab is where you find out why a rule did or didn't run. It lists each event and query the pico handled, newest first, with the channel and policy decision, the attributes, which rules were selected and which fired, any `klog` output, the directives returned, and the events the rules raised. Add `klog` to a binding to see a value:

```krl
my_name = event:attr("name").klog("saw name: ")
```

For repeatable tests, or to try an event from a script, use `curl` or [Postman](/developing/postman) against the [Event and Query APIs](/exp/).

If you run the engine under a different host name or port than `localhost:3000`, remember the browser's passkey is tied to that address (see the operator guide's `baseUrl` and `webauthn` settings). Otherwise you can ignore passkeys in the workflow: you register once, on the first visit.

## Release

For local development there is nothing to do beyond Deploy.

When others use your ruleset, they need a *stable* version, even while you keep working. Any HTTP server will do:

- **GitHub.** Make a Git tag or a GitHub release for each version, and give users the raw URL at that tag (for example `https://raw.githubusercontent.com/<owner>/<repo>/v1.2.0/<path>.krl`). Keep `master` for work in progress.
- **Object storage such as S3.** Use a directory per release. Make sure the engine can read the URL.

Users install from that URL. A flush rereads the same URL, so a tagged URL stays put until they choose a new one.

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/32754595) (last edited there 2021-01-07), and updated for this engine.</small>
