# Child pico tasks

A pattern for work that takes a while: give each job its own child pico. The parent creates a child, hands it the task, and goes back to handling events. The child does the work, sends the result to its parent, and asks to be deleted. Nothing waits on a timer. Each step is an event that starts the next one.

The task here is counting the primes up to `n`, which is slow enough for large `n` that you can watch the children come and go in the developer UI.

To run it, follow the [instructions](/cookbook/child_tasks/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Task runner | [`com.example.task_runner.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/child_tasks/com.example.task_runner.krl) | `wrangler:new_child_request` with extra attributes, `wrangler:child_initialized`, installing a ruleset on a child with `event:send`, and `wrangler:child_deleted`. Has a Tasks `@view` |
| Task worker | [`com.example.task_worker.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/child_tasks/com.example.task_worker.krl) | Doing the work when it is installed, reporting with `event:send` to `wrangler:parent_eci()`, and deleting itself with `wrangler:ready_for_deletion` |
| Task runner bootstrap | [`com.example.task_runner.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/child_tasks/com.example.task_runner.bootstrap.krl) | Sets up the demo on a new pico and starts tasks for 1,000, 10,000, and 30,000. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the task runner pico for the page. The bootstrap installs it. The workers don't need it.
