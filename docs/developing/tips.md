# Developer Tips

A few things that make managing your pico engine, and writing KRL, easier. The [operator guide](/pico-engine) is the full reference for configuration; this page is the short, practical version.

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

## Writing and running rulesets

### Host the source where the engine can reach it

The engine reads your KRL from a URL. Your own files can use `file:///…` (three slashes) while you develop on the same machine. For anything shared, any HTTP server works:

- **GitHub:** use the raw URL, `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>.krl`. GitHub caches raw files for a few minutes, so a push may take a moment to show. GitLab and others may cache less. For a private repository the engine needs a URL that includes an access token.
- **S3 or any static host:** make sure the URL is readable by the engine.

See [Hosting and checking rulesets](/patterns_and_tips/hosting-and-checking-rulesets).

### Flush after every change

The engine compiles each ruleset once and caches it. After you change the source, flush it so the engine fetches and compiles it again. There are two ways:

- **From the UI.** On the pico's **Rulesets** tab, click **flush** next to the ruleset.
- **From a rule.** `raise wrangler event "rulesets_need_flushing"` re-fetches every ruleset installed in the pico and then raises `wrangler:rulesets_flushed`.

Flushing is by URL. The engine keeps one compiled version per URL, so every pico with that ruleset gets the update.

The engine also offers `/api/flush?url=<ruleset url>`, which is what the UI uses. It needs the signed-in browser session, so it doesn't work from a plain `curl`; use the UI or the wrangler event instead.

### Check your KRL before the engine sees it

You can discover a syntax error by installing the ruleset and reading the engine's complaint, which includes the line and column. It's faster to catch it earlier:

```sh
npm install -g krl-compiler
krl-check my.ruleset.krl
```

`krl-check` parses and compiles, and lints doc comments. Install a Git pre-commit hook so that nothing broken gets committed; [Hosting and checking rulesets](/patterns_and_tips/hosting-and-checking-rulesets) has one. Keep `krl-compiler` at the same version as your engine.

### Use the Testing and Logging tabs

- The **Testing** tab builds a form for each event and query a ruleset offers, using the ruleset's doc comments (`@attr`, `@param`, `@example`). Document your rules and shared functions and the forms write themselves.
- The **Logging** tab shows what the pico did for each event or query: the channel and its policy decision, the attributes, which rules were selected and which fired, directives, raised events, and `klog` output. Use the filters to narrow it to a ruleset, an event, or errors. It keeps recent transactions per pico in memory (200 by default, `PICO_ENGINE_LOG_RING`), so a restart clears it. The log file on disk keeps the full record; see [Reading the engine's log files](/patterns_and_tips/engine-log-files).
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

More about this in [Initializing entity variables](/patterns_and_tips/initializing-entity-variables) and [Bootstrap and channels](/cookbook/bootstrap/).

### Wrangler, not `ctx`, in application rulesets

For children, channels, ruleset installation, and queries between picos, use wrangler's events and functions (`wrangler:new_child_request`, `wrangler:picoQuery`, and so on). The engine's lower-level `ctx:*` actions exist for wrangler and the platform to use. See [Wrangler](/wrangler/).

---

<small>Ported from the [Pico Labs wiki](https://picolabs.atlassian.net/wiki/spaces/docs/pages/31544297) (last edited there 2021-04-12), and updated for this engine.</small>
