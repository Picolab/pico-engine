# Configuration and secrets

Rulesets that use outside services need secrets: API keys, passwords, webhook URLs with tokens in them. Those don't belong in KRL source, which ends up in repositories and on web servers. There are two ways to get a secret into a ruleset instead:

- **Install configuration.** `wrangler:install_ruleset_request` takes a `config` map, and the ruleset reads it as `meta:rulesetConfig`.
- **An event.** A rule selects an event the operator sends, and keeps the secret in an entity variable.

Either way, the secret is not as hidden as it might seem. This demo shows both ways and where the secret can still be seen.

The demo has two picos. The **hook service** stands in for an outside service, such as a chat app, that accepts posts at a webhook URL with a token in it. It gets its token from install configuration. The **notifier** posts messages to that webhook. It gets the URL in an event, and until then the rule that posts is not selected, so it can be installed on a working pico and does nothing until it is configured.

To run it, follow the [instructions](/cookbook/secrets/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Notifier | [`com.example.notifier.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/secrets/com.example.notifier.krl) | A secret from an event, kept in an entity variable; a rule guarded by `where ent:webhook_url`; `http:post`; an operator event in its own domain, so the app channel can't reach it; a status that hides the token |
| Hook service | [`com.example.hook_service.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/secrets/com.example.hook_service.krl) | A secret from `meta:rulesetConfig`, a channel that takes only `hook:post`, and rules that accept or refuse a post by its token |
| Bootstrap | [`com.example.notifier.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/secrets/com.example.notifier.bootstrap.krl) | Installs the notifier, creates the hook service with a random token in its configuration, and sends messages before and after configuring the notifier. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the pages, which use the shared `PicoTheme` component).
- `io.picolabs.xmlui` on both picos for the pages. The bootstrap installs it.
