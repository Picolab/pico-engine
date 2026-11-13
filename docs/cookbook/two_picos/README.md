# Two picos talking

Picos talk to each other over **relationships**. A relationship is a pair of channels, one on each pico, made for that connection and labeled with each side's role. This demo has two picos. Alice is an *answerer* who knows some facts about herself. Bob is an *asker*. Bob asks Alice for a relationship, Alice accepts, and Bob asks her questions by querying her over it.

Neither pico needs the other's family channels or knows where it lives in the pico tree. Bob reaches Alice only through the relationship, and only for what Alice's ruleset shares.

To run it, follow the [instructions](/cookbook/two_picos/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Answerer (Alice) | [`com.example.two_picos.answerer.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/two_picos/com.example.two_picos.answerer.krl) | Accepting relationship requests by role (`inbound_pending_subscription_added`, `pending_subscription_approval`), a shared `answer` function, and a page to teach Alice facts |
| Asker (Bob) | [`com.example.two_picos.asker.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/two_picos/com.example.two_picos.asker.krl) | Asking for a relationship through a well-known channel (`wrangler:subscription`), reacting to `subscription_added`, and querying the other side with `subscription:queryOnSub`. Has a conversation page |
| Bootstrap | [`com.example.two_picos.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/two_picos/com.example.two_picos.bootstrap.krl) | Creates Alice and Bob as children, installs their rulesets, and introduces Bob to Alice's well-known channel. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the pages, which use the shared `PicoTheme` component).
- `io.picolabs.xmlui` on Alice and Bob for their pages. The bootstrap installs it.
