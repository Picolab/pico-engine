# Developing with Picos

Practical notes for people writing KRL and running picos on the pico engine: how a ruleset gets from your editor into a running pico, what the engine does when an event arrives, and the mistakes that cost the most time.

If you're new, start with the [Programming lessons](/lessons/), which build a working system step by step. Come back here when you want the "why did that happen?" and "how do I set things up?" answers.

## In this section

1. [Programming Workflow](/developing/workflow): develop, build, deploy, test, and release a ruleset.
2. [Event Loop Introduction](/developing/event-loop): the five phases a pico goes through for every event, and why rule order can surprise you.
3. [Developer Tips](/developing/tips): installing and updating the engine, resetting it, running several, hosting and flushing rulesets, and initializing a ruleset.
4. [Event and Query URLs with Postman](/developing/postman): building Sky event and query requests in Postman (or `curl`).
5. [KRL misconceptions and common errors](/developing/misconceptions): where habits from other languages mislead, and the typos that are hard to see.

## Elsewhere in the docs

- [Programming lessons](/lessons/): hands-on lessons from the Quickstart to scatter-gather.
- [KRL manual](/krl/): the language and its libraries.
- [Event Exchange Protocol](/exp/): the Sky event and query APIs.
- [Patterns and tips](/patterns_and_tips/): short techniques, including [Hosting and checking rulesets](/patterns_and_tips/hosting-and-checking-rulesets).

The engine listens on port 3000 by default, so the examples here use `http://localhost:3000`. Change that if you've configured another port or public URL (see the [operator guide](/pico-engine)).

---

<small>Section intro for pages ported from the Pico Labs wiki (Programming Workflow, Event Loop Introduction, Developer Tips, Event and Query URLs with Postman, KRL misconceptions and common errors), updated for this engine.</small>
