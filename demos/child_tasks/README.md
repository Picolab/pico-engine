# Child pico tasks demo

A pico that never waits: each task runs in a new child pico, which reports back to its parent and then deletes itself.

- Overview: [`docs/cookbook/child_tasks/README.md`](../../docs/cookbook/child_tasks/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/child_tasks/)
- Instructions: [`docs/cookbook/child_tasks/instructions.md`](../../docs/cookbook/child_tasks/instructions.md)

| File | Shows |
|------|-------|
| `com.example.task_runner.krl` | The parent: creates a child per task, hands it the task, records the result, and notes when the child is gone. Has the Tasks page |
| `com.example.task_worker.krl` | The child: counts primes up to `n`, sends `task:done` to its parent, and asks to be deleted |
| `com.example.task_runner.bootstrap.krl` | Sets up the demo on a new pico and starts three tasks; the **Try It!** tab runs it |
