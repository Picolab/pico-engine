# Echo

The smallest useful pico: it answers events. An event arrives on a channel, a rule selects on it, and the rule's action is a **directive**, a named piece of data returned to whoever sent the event. Echo has two rules. `echo:hello` answers "Hello World", and `echo:message` answers with whatever `input` it was sent.

A page served by the pico sends both events and shows the answer. The same events work from `curl`, which shows that a pico's events are plain HTTP.

To run it, follow the [instructions](/cookbook/echo/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Echo | [`com.example.echo.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/echo/com.example.echo.krl) | `select when` with an attribute regex, `send_directive`, and a `@view` that reads directives from the event response. Creates an app channel that allows only `echo` events |
| Echo bootstrap | [`com.example.echo.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/echo/com.example.echo.bootstrap.krl) | Sets up the demo on a new pico. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the pico for the page. The bootstrap installs it.
