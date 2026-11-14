# Tips

Practical notes for running the engine and writing KRL. Engine setup is below; technique pages (from the old Patterns and tips / KRL Cookbook) are indexed further down. The [operator guide](/pico-engine) is the full configuration reference.

## Managing your engine

### Install, update, and check the version

```sh
npm install -g pico-engine      # install, or update to the latest
npm install -g pico-engine@<version>  # a specific version
pico-engine                      # run it (port 3000 by default)
pico-engine --version            # which version is this?
npm ls -g --depth 0 pico-engine  # what npm has installed
```

Back up your data directory (`~/.pico-engine` by default) before you update, and especially before you *downgrade*. A different engine version may not read what a newer one wrote.

To remove the engine code (not your picos, which live in the data directory):

```sh
npm rm -g pico-engine
```

### Start over

The engine keeps everything in its data directory, `PICO_ENGINE_HOME`, which defaults to `~/.pico-engine`:

| Folder | What's in it |
|--------|--------------|
| `db/` | Picos, channels, users, identity |
| `rulesets-db/` | Which URL each ruleset came from (rebuildable) |
| `rulesets/` | Compiled rulesets (rebuildable) |

To wipe all picos and begin with a fresh engine, stop the engine and delete the data directory. You then register a new passkey on your next visit, and get a new root pico:

```sh
rm -r ~/.pico-engine
```

> **There is no undo.** Deleting `db/` deletes your picos. Deleting only `rulesets-db/` and `rulesets/` is harmless: they're rebuilt when rulesets are installed again. Adjust the path if you set `PICO_ENGINE_HOME` to somewhere else.

### Keep separate projects apart

The data directory is an *image* of the engine's state: all its picos and rulesets. Point `PICO_ENGINE_HOME` at different directories to keep projects separate, and return to where you left off in each:

```sh
PICO_ENGINE_HOME=~/.game_image pico-engine
PICO_ENGINE_HOME=~/.iot_image pico-engine
```

### Run more than one engine

To run several engines on one machine at once, give each its own port, its own data directory, and the matching public URL:

```sh
PORT=3001 PICO_ENGINE_HOME=~/.pico-engine-1 pico-engine
```

Never point two running engines at the same data directory. Engines can also be configured with a config file per process (`pico-engine -c file.json`). See [Multiple engines on one host](/pico-engine#multiple-engines-on-one-host).

### The base URL

The engine knows its own address, `http://localhost:3000` by default, and gives it to your KRL as `meta:host` (and uses it to build links). To use another address, such as a machine's name or a public domain, set `PICO_ENGINE_BASE_URL`:

```sh
PICO_ENGINE_BASE_URL=http://my-machine.local:3000 pico-engine
```

This is also what passkeys are bound to: the browser's passkey only works at the address the engine thinks it has. If you open the engine from a different host name than the one you registered with, sign-in fails; see `webauthn` in the operator guide.

The engine reads the address once, at startup. TLS isn't terminated by the engine, so for HTTPS put a reverse proxy in front of it and set the base URL to the public HTTPS address.

### Docker

There's an official image, `picolabs/pico-engine`. Mount a volume for the data directory and set the same variables you'd set for the command line:

```sh
docker run -p 3001:3000 \
  -v ~/images/pico-image:/var/pico-image \
  -e PICO_ENGINE_HOME=/var/pico-image \
  -e PICO_ENGINE_BASE_URL=http://localhost:3001 \
  picolabs/pico-engine:<version>
```

You can run the image several times with different ports and volumes to get several independent engines. Don't share one volume between running containers. The package README covers Docker Compose and AWS Fargate with EFS.

### Windows

WSL 2 (a Linux environment on Windows) is a good way to run the engine on Windows. If a browser on Windows can't reach an engine running in WSL 2, the usual culprit is bridging the port between Windows and the virtual machine. Also check that the base URL matches the address the browser uses.

## Hosting, flushing, and checking rulesets

### Host the source where the engine can reach it

The engine installs a ruleset from a URL and remembers it:

- **Your own files**, while you work: `file:///path/to/my.ruleset.krl` (three slashes). The engine must be on the same machine.
- **GitHub:** use the *raw* URL, `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>.krl`, not the page that displays the file. GitHub caches raw files for a few minutes. For a private repository the engine needs a URL that includes an access token.
- **The engine's own:** `http://<engine>/krl/<rid>.krl` for rulesets that ship with it, and `/krl/demos/...` for demos.
- **S3 or any static host:** make sure the URL is readable by the engine.

### Flush after every change

The engine compiles each ruleset once and caches it. After you change the source, flush it so the engine fetches and compiles it again:

- **From the UI.** On the pico's **Rulesets** tab, click **flush** next to the ruleset.
- **From a rule.** `raise wrangler event "rulesets_need_flushing"` re-fetches every ruleset installed in the pico and then raises `wrangler:rulesets_flushed`.

Flushing is by URL. The engine keeps one compiled version per URL, so every pico with that ruleset gets the update. Flushing does **not** raise `wrangler:ruleset_installed` again, so rules that run on install don't run. If you change what such a rule sets up (for example a channel's policy), run that rule again yourself. The [Bootstrap and channels](/cookbook/bootstrap/) demo shows how.

The UI uses `/api/flush?url=<ruleset url>`, which needs the signed-in browser session, so it doesn't work from a plain `curl`; use the UI or the wrangler event instead.

### Check your KRL before the engine sees it

```sh
npm install -g krl-compiler
krl-check my.ruleset.krl
```

`krl-check` parses and compiles, and lints doc comments and views. It exits with status 1 on an error and prints warnings to stderr. With no file, it reads standard input. Keep `krl-compiler` at the same version as your engine.

A Git pre-commit hook that checks the *staged* version of each `.krl` file:

```sh
#!/bin/sh
status=0
for f in $(git diff --cached --name-only --diff-filter=ACM -- '*.krl'); do
  if ! git show ":$f" | krl-check >/dev/null; then
    echo "krl-check failed: $f"
    status=1
  fi
done
exit $status
```

Save it as `.git/hooks/pre-commit` and make it executable. `git show ":$f"` is the staged copy, so a fix you haven't staged yet doesn't hide an error. See also [Programming Workflow](/developing/workflow).

## Writing and debugging

### Use the Testing and Logging tabs

- The **Testing** tab builds a form for each event and query a ruleset offers, using the ruleset's doc comments (`@attr`, `@param`, `@example`). Document your rules and shared functions and the forms write themselves.
- The **Logging** tab shows what the pico did for each event or query: the channel and its policy decision, the attributes, which rules were selected and which fired, directives, raised events, and `klog` output. Use the filters to narrow it to a ruleset, an event, or errors. It keeps recent transactions per pico in memory (200 by default, `PICO_ENGINE_LOG_RING`), so a restart clears it. The log file on disk keeps the full record; see [Reading the engine's log files](/developing/engine-log-files).
- `.klog("label: ")` returns the value it's applied to, so you can add it in the middle of an expression without changing the code.

### "Not allowed by channel policy"

This is the most common surprise when calling a pico from outside. The channel you used doesn't permit that event or query. Try another channel on the **Channels** tab, or give the channel a policy that allows what you need. See [Managing channels](/wrangler/channels).

### Initialize a ruleset when it's installed

Rulesets often need setup: default values for entity variables, a scheduled event, a channel. Wrangler raises `wrangler:ruleset_installed` when a ruleset is installed in a pico, and a rule in your ruleset can select on that event. Always check that the ruleset that was installed is yours, or the rule runs every time *any* ruleset is installed:

```krl
rule initialize_ruleset {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  if ent:heartbeat_period.isnull() then noop()
  fired {
    ent:heartbeat_period := event:attr("heartbeat_period") || 60;
    ent:emitter_state := "running"
  }
}
```

Two cautions:

- The event isn't raised again on a flush, so a change to this rule's setup doesn't take effect on picos that already have the ruleset.
- Guard each initialization with `isnull()` so you never overwrite state that has accumulated.

More: [Initializing entity variables](/developing/initializing-entity-variables) and [Bootstrap and channels](/cookbook/bootstrap/).

### Wrangler, not `ctx`, in application rulesets

For children, channels, ruleset installation, and queries between picos, use wrangler's events and functions (`wrangler:new_child_request`, `wrangler:picoQuery`, and so on). The engine's lower-level `ctx:*` actions exist for wrangler and the platform to use. See [Wrangler](/wrangler/).

## Technique tips

Short techniques for writing KRL and working with picos, checked against this engine. For runnable examples, see the [Cookbook](/cookbook/) and the **Try It!** tab. Event and query URLs live in the [Event Exchange Protocol](/exp/).

### Working with data

| Page | What it covers |
|------|----------------|
| [Initializing entity variables](/developing/initializing-entity-variables) | `defaultsTo`, a guard rule, or a rule that runs on install |
| [Arrays and maps](/developing/arrays-and-maps) | Loops with `reduce`, flattening, and sorting arrays of maps by one key or two |
| [Decoding form-encoded data](/developing/decoding-form-data) | Turning `a=1&b=2` into a map, keeping repeated names, and decoding `+` and `%xx` |
| [Importing tables and CSV](/developing/tabular-data) | Tab- and comma-separated exports to arrays and maps, fetched with `http:get` |
| [Converting time formats](/developing/converting-time-formats) | RSS (RFC 2822) dates to the RFC 3339 form the time library uses |
| [What's in a name?](/developing/names-and-scope) | KRL's separate kinds of names, and how a `pre` declaration shadows a global |

### HTTP and the outside world

| Page | What it covers |
|------|----------------|
| [Cookies and redirects](/developing/cookies-and-redirects) | The `_cookie` and `_redirect` directives, reading cookies, and a URL shortener |
| [Events from email](/developing/events-from-email) | A mail webhook to an event, routing by address, and turning message lines into events |
| [Reading the engine's log files](/developing/engine-log-files) | Where the logs are, how they rotate, and one pico's history with `grep` and `jq` |
| [Event and Query URLs with Postman](/developing/postman) | Building Sky requests in Postman or `curl` |

### Picos working together

| Page | What it covers |
|------|----------------|
| [Querying another pico](/developing/querying-another-pico) | `wrangler:picoQuery`, which channel to use, why a pico can't query itself, and `http:get` |
| [Accepting relationship requests](/developing/accepting-relationship-requests) | An approving rule, wrangler's auto-accept configuration, and a ruleset that accepts later and removes itself |
| [One pico per resource](/developing/singleton-picos) | Giving a device or account its own pico, so requests can't collide |

### Patterns that became demos

| Pattern | Demo |
|---------|------|
| Idempotency and guard rules; authorize, then use | [Guard rules](/cookbook/guard_rules/) |
| Splitting rules for clarity and extensibility; layering functionality with rulesets; semantic translation | [Layered rulesets](/cookbook/layered_rulesets/) |
| Collection picos | [Collection](/cookbook/collection/) |
| Access tokens and other secrets; keeping keys safe | [Configuration and secrets](/cookbook/secrets/) |
| Installing a multi-ruleset application; creating a channel for a ruleset | [Bootstrap and channels](/cookbook/bootstrap/) |
| An echo server | [Echo](/cookbook/echo/) |
| A score tracker | [Score tracker](/cookbook/score_tracker/) |
| A child pico for an asynchronous task | [Child pico tasks](/cookbook/child_tasks/) |
| Automatic replies to relationship requests; querying over a relationship | [Two picos talking](/cookbook/two_picos/) |
| An event hierarchy across rulesets | [KBlog](/cookbook/kblog/) |

### In the KRL manual

- [Persistent variables](/krl/persistent-variables/)
- [User-defined actions](/krl/krl-expression-language/user-defined-actions)

### Left out of the old cookbook

- **Sending secure messages** used `engine:signChannelMessage` and its relatives, which are gone. Relationships can use DIDComm; see [Relationships](/wrangler/relationships).
- **Shorter URL for a query or event** used `io.picolabs.rewrite` on the root pico, removed in engine 1.0. A ruleset can do the same with `_redirect`: see [Cookies and redirects](/developing/cookies-and-redirects).
- **Account management using the root pico** described owner picos from before engine 1.0.
- **Generate an image with KRL**, **Using Foursquare data**, **Using Wovyn sensors**, **Using Git**, and **Using a Google sheet** are about particular services rather than KRL.
- **Proposals, experiments, and proofs of concept** were experiments on earlier engines.

---

<small>Merges the [Developer Tips](https://picolabs.atlassian.net/wiki/spaces/docs/pages/31544297) wiki page (last edited there 2021-04-12) with the Patterns and tips / KRL Cookbook pages that still apply, updated for this engine.</small>
