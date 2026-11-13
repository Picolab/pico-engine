# Layered rulesets

A pico does what its installed rulesets do, so installing another ruleset is how you change it. That works best when the rulesets already there leave room. Two habits make room:

- **Each rule does one thing.** When reacting to an event takes several steps, one rule raises an event that starts the next.
- **No rule ends the chain.** A rule that finishes its work raises an event saying so, even if nothing listens yet. Later, another ruleset can.

This demo's base ruleset accepts invitations: URLs with a `c_i` parameter that encodes who is inviting. Two add-on rulesets layer on top without changing it. One accepts short links the base doesn't recognize. It selects the same event with its own URL pattern, expands the link, and raises the event again with the full invitation. The other welcomes each new connection by reacting to the event the base raises when it is done.

To run it, follow the [instructions](/cookbook/layered_rulesets/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Invitations (base) | [`com.example.invitations.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/layered_rulesets/com.example.invitations.krl) | A rule selected by an attribute regex that records the connection and raises `invite:connection_made`. Has an Invitations `@view` that walks through adding the add-ons one at a time, says what to expect at each step, and lists every directive in the reply |
| Short links (add-on) | [`com.example.invitations.short_links.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/layered_rulesets/com.example.invitations.short_links.krl) | Selecting the same event with a different pattern, and raising it again with new attributes |
| Welcome (add-on) | [`com.example.invitations.welcome.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/layered_rulesets/com.example.invitations.welcome.krl) | Reacting to the event another ruleset raises when it finishes |
| Bootstrap | [`com.example.invitations.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/layered_rulesets/com.example.invitations.bootstrap.krl) | Installs only the base ruleset; the page adds the layers. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the pico for the page. The bootstrap installs it.
