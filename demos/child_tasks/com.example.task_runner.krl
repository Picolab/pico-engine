/**
 * Task runner: hands each task to a new child pico, so this pico never waits.
 * task:start creates a child and installs com.example.task_worker on it with
 * the task. The worker does the work, sends task:done back, and asks wrangler to
 * delete it. This pico records the result and notes when the child is gone.
 */
ruleset com.example.task_runner {
  meta {
    name "Task runner"
    description "Runs each task in its own child pico, which reports back and deletes itself."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.xmlui alias ui

    shares tasks, tasksPage
  }

  global {
    channel_tags = ["task_runner", "app"]
    worker_rid = "com.example.task_worker"

    /**
     * Every task, newest first.
     * @returns Array of { id, n, status, primes, worker, started, finished }
     */
    tasks = function() {
      ent:tasks.defaultsTo({}).values()
        .sort(function(a, b) { b{"id"} <=> a{"id"} })
    }

    /**
     * Start tasks and watch child picos do them.
     * @view "Tasks"
     */
    tasksPage = function() {
      tasks_url = ui:query_url("tasks", meta:rid, meta:eci)
      start_url = ui:event_url("task", "start")
      <<
<Component name="TasksPage">
  <DataSource id="list" url="#{tasks_url}" headers="{appGlobals.auth}" pollIntervalInSeconds="2" />
  <APICall id="start" method="post" url="#{start_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="list.refetch()" />
  <PicoTheme>
    <Card title="Tasks"
          subtitle="Each task counts the primes up to n in its own child pico. Watch the children appear in the developer UI and go away when they finish." />
    <Form saveLabel="Start a task" onSubmit="(data) => start.execute(data)">
      <FormItem bindTo="n" label="Count primes up to" type="integer" initialValue="20000" />
    </Form>
    <Table data="{list}">
      <Column bindTo="id" header="Task" />
      <Column bindTo="n" header="n" />
      <Column bindTo="status" header="Status" />
      <Column bindTo="primes" header="Primes" />
      <Column bindTo="worker" header="Worker pico" />
    </Table>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Start a task: count the primes up to n in a new child pico.
   * @attr n Number "count primes up to this number"
   * @example "twenty thousand" { "n": "20000" }
   */
  rule start_task {
    select when task start
      n re#^(\d+)$#
      setting(n)
    pre {
      id = ent:next_id.defaultsTo(1)
      key = id.as("String")
    }
    always {
      ent:next_id := id + 1
      ent:tasks{key} := {"id": id, "n": n.as("Number"), "status": "starting", "started": time:now()}
      raise wrangler event "new_child_request" attributes
        {"name": "Task " + key, "task_id": key, "n": n}
    }
  }

  // The child is set up; give it the worker ruleset and the task.
  rule hand_off_task {
    select when wrangler child_initialized where event:attr("task_id")
    pre {
      key = event:attr("task_id")
      child = event:attr("eci")
    }
    event:send({
      "eci": child,
      "domain": "wrangler",
      "type": "install_ruleset_request",
      "attrs": {
        "absoluteURL": meta:rulesetURI,
        "rid": worker_rid,
        "task_id": key,
        "n": event:attr("n")
      }
    })
    always {
      ent:tasks{[key, "status"]} := "working"
      ent:tasks{[key, "worker"]} := event:attr("name")
      ent:tasks{[key, "worker_eci"]} := child
    }
  }

  /**
   * A worker finished.
   * @attr task_id String "the task"
   * @attr primes Number "how many primes it found"
   */
  rule task_done {
    select when task done
      task_id re#(.+)#
      setting(key)
    always {
      ent:tasks{[key, "status"]} := "done"
      ent:tasks{[key, "primes"]} := event:attr("primes")
      ent:tasks{[key, "finished"]} := time:now()
    }
  }

  // Wrangler deleted a worker that asked to be deleted.
  rule worker_deleted {
    select when wrangler child_deleted
    foreach ent:tasks.defaultsTo({}).values() setting(task)
    if task{"worker_eci"} == event:attr("eci") then noop()
    fired {
      ent:tasks{[task{"id"}.as("String"), "worker"]} := task{"worker"} + " (deleted)"
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["task"], ["tasks", "tasksPage"], meta:rid)
  }
}
