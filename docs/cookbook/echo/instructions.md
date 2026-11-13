# Echo: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/echo/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Echo**, then **Run in a new child pico**. When it shows **ready**, open **Echo page**.

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install the echo ruleset: `http://localhost:3000/krl/demos/echo/com.example.echo.krl` (the engine's copy), or the raw GitHub file `https://raw.githubusercontent.com/Picolab/pico-engine/master/demos/echo/com.example.echo.krl`.
4. Installing it creates a channel tagged `echo, app`. Click **View** next to `com.example.echo` and open it on that channel.

## Try it

- Click **Say hello**. The page raises `echo:hello`, and the **The pico said** card shows `Hello World`.
- Type a message and click **Echo it**. The pico answers with your message.
- Copy the `curl` line at the bottom of the page into a terminal. The engine answers with JSON like this:

  ```json
  {"eid": "...", "directives": [{"type": "directive", "name": "say", "options": {"something": "hello"},
    "meta": {"rid": "com.example.echo", "rule_name": "echo", "txnId": "..."}}],
   "ruleOutcomes": [{"rid": "com.example.echo", "rule": "echo", "status": "fired"}]}
  ```

- Change `echo/message` in that URL to `wrangler/new_child_request?name=x`. The answer is `{"error":"Error: Not allowed by channel policy"}`: this channel accepts only `echo` events.
- On the pico's **Testing** tab, raise `echo` `hello` and look at the response.

## How it works

An event has a domain and a type (`echo` and `message`) and some attributes. A rule's `select when` decides which events it runs on:

```krl
rule echo {
  select when echo message input re#(.*)# setting(m)
  send_directive("say", {"something": m})
}
```

`input re#(.*)#` matches the `input` attribute against a regular expression, and `setting(m)` binds what it captured. `send_directive` adds a directive to the response. The engine collects the directives of every rule that ran and returns them to the sender, which is how the page and `curl` see the answer.

The page is a `@view` function. Its `APICall` posts the event and reads the answer from the response:

```xml
<APICall id="hello" method="post" url="#{hello_url}" headers="{appGlobals.auth}"
         onSuccess="(result) => reply = result.directives[0].options.something" />
```

On install, `ui:create_app_channel` makes the `echo, app` channel. Its policy allows events in the `echo` domain and the page's queries, and nothing else. Someone holding that channel can make the pico echo but cannot change it.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit `com.example.echo.krl` there, click **Flush**, and reload the page.

- Change `"Hello World"` in `hello_world` to your own greeting.
- Make the echo shout: `send_directive("say", {"something": m.uc()})`.
- Add a rule that answers a new event, such as `echo goodbye`. The app channel already allows every `echo` event, so the page and `curl` can send it right away.
