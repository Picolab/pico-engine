# Child pico tasks: instructions

These steps use the developer UI of a running engine at `http://localhost:3000`. Replace that with your engine's URL. See the [overview](/cookbook/child_tasks/) for what the demo shows.

## The quick way: Try It!

On the root pico in the developer UI, open the **Try It!** tab, click **Child pico tasks**, then **Run in a new child pico**. The bootstrap starts three tasks. When it shows **ready**, open **Tasks**. The three tasks are done: 168 primes up to 1,000, 1,229 up to 10,000, and 3,245 up to 30,000. Each worker is marked "(deleted)".

## By hand

1. Create a child pico and open its **Rulesets** tab.
2. Install `io.picolabs.xmlui` from the engine: `http://localhost:3000/krl/io.picolabs.xmlui.krl`.
3. Install the task runner: `http://localhost:3000/krl/demos/child_tasks/com.example.task_runner.krl`. You don't install the worker. The runner installs it on each child from the same folder.
4. Installing it creates a channel tagged `task_runner, app`. Click **View** next to `com.example.task_runner` and open it on that channel.

## Try it

- Start a task with the default `n` of 20,000. It finishes in well under a second: 2,262 primes.
- Start one with `n` set to 200,000, which takes about ten seconds on a laptop. The table shows it as **working**. In the developer UI, the task runner pico has a child named after the task. When the task is done, the child is gone and the table says "(deleted)".
- Start several large tasks one after another. Each gets its own child, and the runner keeps taking new tasks while they work.

## How it works

The runner never does the work itself. It is a chain of events:

1. **`task:start`.** `start_task` records the task as `starting` and asks wrangler for a child. It passes extra attributes, the task id and `n`, along with the name:

   ```krl
   raise wrangler event "new_child_request" attributes
     {"name": "Task " + key, "task_id": key, "n": n}
   ```

2. **`wrangler:child_initialized`.** Wrangler raises this on the parent when the child is set up. It carries the same extra attributes, plus `eci`, the parent's channel to the child. `hand_off_task` selects on it only when `task_id` is present, so it ignores children created for other reasons. Then it sends the child an `install_ruleset_request` for the worker, again with `task_id` and `n`:

   ```krl
   event:send({
     "eci": child,
     "domain": "wrangler",
     "type": "install_ruleset_request",
     "attrs": {"absoluteURL": meta:rulesetURI, "rid": worker_rid, "task_id": key, "n": event:attr("n")}
   })
   ```

   `absoluteURL: meta:rulesetURI` with a `rid` installs `com.example.task_worker.krl` from the folder the runner came from.

3. **`wrangler:ruleset_installed`, on the child.** The attributes of the install request come through on this event. `do_task` in the worker selects on its own install, counts the primes, sends `task:done` to `wrangler:parent_eci()`, and raises `wrangler:ready_for_deletion`.

4. **`task:done`, on the parent.** `task_done` records the result.

5. **`wrangler:child_deleted`, on the parent.** `ready_for_deletion` asks the parent's wrangler to delete the child. Once it is gone, wrangler raises `child_deleted` with the child's `eci`. `worker_deleted` finds the task with that `worker_eci` and marks the worker deleted.

Every pico has its own event queue. While a worker is counting, its parent can keep starting tasks, and the developer UI keeps working.

## Change it and watch

The **Try It!** window lists each file with its path on disk. Edit a file there, click **Flush**, and start a new task.

- In `com.example.task_worker.krl`, comment out `raise wrangler event "ready_for_deletion"`. Workers now stay around after they finish, and you can open one in the developer UI to see the worker ruleset and its parent channel. Delete them from the UI when you are done.
- Have the worker report more. Add `"largest": …` to the `task:done` attributes, store it in `task_done`, and add a column to the Tasks page in `com.example.task_runner.krl`.
- Give the worker a different job, such as summing the numbers up to `n`. The runner doesn't care what the work is.
