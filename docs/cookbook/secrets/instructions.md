# Configuration and secrets: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/secrets/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Configuration and secrets**, then **Run in a new child pico**. When it shows **ready**, open **Notifier** and **Hook service inbox**.

- The Notifier page says where it posts, with the token hidden. One message was not sent, because it came before the webhook was set. One was delivered, with HTTP status 200.
- The inbox has the delivered message, and no refused posts.

## By hand

1. Create a pico for the hook service. On its **Rulesets** tab, install `http://localhost:3000/krl/io.picolabs.xmlui.krl`. Then install `http://localhost:3000/krl/demos/secrets/com.example.hook_service.krl` with a configuration, such as `{"token": "pick-a-long-random-string"}` (the **Rulesets** tab has a box for it).
2. The hook service sends its webhook URL to its parent pico as `hook_service:webhook_url_issued`. Find it in the parent's **Logging** tab, or build it yourself: `http://localhost:3000/sky/event/<eci>/webhook/hook/post?token=<token>`, where `<eci>` is the hook service's channel tagged `hook_service, webhook`.
3. Create a pico for the notifier and install `io.picolabs.xmlui` and `http://localhost:3000/krl/demos/secrets/com.example.notifier.krl` on it. Open its page on the `notifier, app` channel and send a message: it is not sent.
4. On the notifier's **Testing** tab, raise `notifier_config` `new_webhook` with `webhook_url` set to the URL from step 2. Send a message from the page again: it is delivered.

## Try it

- On the Notifier page, send a few messages. Each appears in the inbox and in the Notifier's list with status 200.
- Post to the webhook with the wrong token. Take the URL the Notifier page shows, replace `(hidden)` with anything, and `curl -X POST` it. The hook service answers with a `refused` directive, and its **Refused** count goes up.
- On the Notifier's **Testing** tab, raise `notifier_config` `webhook_forgotten`. Messages from the page are counted as not sent again.

## Where the secrets are visible

Neither secret is in a ruleset file. That is the point of both methods. But both can still be seen, by anyone who can see the developer UI or the engine's files:

| Where | What shows |
|-------|------------|
| **Rulesets** tab, on the hook service | The install configuration, with the token, for as long as the ruleset is installed. `wrangler:rulesetConfig` returns it too, to anyone with a channel that allows that query |
| **Logging** tab | Every event's attributes: the install request with its `config`, the `webhook_url_issued` and `new_webhook` events with the URL, and every `hook:post`, because the token is in the URL |
| `pico-engine.log` in the engine's home directory | The same events, until the log files rotate away |
| The pico's database | The entity variables: the notifier's `ent:webhook_url` |

The **Testing** tab hides the values of attributes named like `password`, `secret`, `token`, or `apikey` in its own saved history. The engine's logs don't.

What the rulesets do to help:

- The notifier shares `status()`, which hides the token, and never shares the URL itself.
- `notifier_config:new_webhook` is in its own domain, and the app channel allows only `notifier` events. The page can send messages but can't change where they go. Put operator events in a domain the app channel doesn't allow.
- The rule that posts is selected only `where ent:webhook_url`, so the notifier is idle, not failing, until it has a URL.

## How it works

**From install configuration.** The hook service reads its token from the configuration it was installed with:

```krl
token = function() {
  meta:rulesetConfig{"token"}
}
```

The bootstrap installs it with `"config": {"token": random:uuid()}`, so each run gets a new token.

**From an event.** The notifier keeps the URL it is sent:

```krl
rule set_webhook {
  select when notifier_config new_webhook
    webhook_url re#^(https?://.+)$#
    setting(url)
  always {
    ent:webhook_url := url
    ent:configured_at := time:now()
  }
}
```

**Idle until configured.** Two rules select `notifier:message`, and their `where` clauses decide which one runs:

```krl
rule notify {
  select when notifier message where ent:webhook_url
  pre {
    text = event:attr("text") || "Hello from a pico"
  }
  http:post(ent:webhook_url, json = {"text": text}) setting(response)
  fired {
    ent:deliveries := deliveries().append({"text": text, "status": response{"status_code"}, "time": time:now()})
  }
}

rule not_configured {
  select when notifier message where not ent:webhook_url
  ...
}
```

**Accepting or refusing.** The hook service's webhook channel allows only `hook:post`. Its `receive` rule selects posts `where event:attr("token") == token()`, and `refuse` selects the rest.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and use the pages.

- Show less: in `com.example.notifier.krl`, make `masked` hide everything after the host, not just the token.
- Use configuration for the notifier too: read the URL from `meta:rulesetConfig{"webhook_url"}` when `ent:webhook_url` is not set, and reinstall it with a configuration on the **Rulesets** tab. Then look at where the URL shows.
- Rotate the token: on the hook service's **Rulesets** tab, install `com.example.hook_service` again from the same URL with a new configuration. Messages from the notifier now raise the inbox's **Refused** count. The Notifier still records status 200, because the hook service answers every post and says "refused" in a directive. Make `notify` record the directive's name, or send the notifier the new URL with `notifier_config` `new_webhook`.
