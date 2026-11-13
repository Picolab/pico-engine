# Score tracker

A pico that runs a contest. Contestants register with a first and last name and get a participant id. Then they send points with a description of what they are for, and a leaderboard ranks everyone by total.

The demo is also about **channel policy**. The pico's app channel allows only `score` events and the leaderboard's queries. A contestant holding that channel can register and add points, but cannot create child picos, install rulesets, or raise any other event. Hand out the channel, not the pico.

To run it, follow the [instructions](/cookbook/score_tracker/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Score tracker | [`com.example.score_tracker.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/score_tracker/com.example.score_tracker.krl) | Entity variables keyed by participant id, attribute regexes in `select when`, directives that return the new id, a sorted `currentRanks` query, and a leaderboard `@view` |
| Score tracker bootstrap | [`com.example.score_tracker.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/score_tracker/com.example.score_tracker.bootstrap.krl) | Sets up the demo on a new pico and seeds Ada Lovelace, Grace Hopper, and Alan Turing with points. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the pico for the page. The bootstrap installs it.
