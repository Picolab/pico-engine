/**
 * Task worker: installed on a new child pico with a task. It counts the primes
 * up to n, sends task:done to its parent, and asks wrangler to delete it. The
 * parent is never blocked while the work runs here.
 */
ruleset com.example.task_worker {
  meta {
    name "Task worker"
    description "Does one task, reports to its parent, and deletes itself."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
  }

  global {
    // True when no number from d up to the square root of k divides k.
    noDivisorFrom = function(k, d) {
      d * d > k => true |
      k % d == 0 => false |
      noDivisorFrom(k, d + 1)
    }

    countPrimes = function(n) {
      n < 2 => 0 |
      2.range(n).filter(function(k) { noDivisorFrom(k, 2) }).length()
    }
  }

  rule do_task {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    pre {
      n = event:attr("n").as("Number")
      primes = countPrimes(n)
    }
    event:send({
      "eci": wrangler:parent_eci(),
      "domain": "task",
      "type": "done",
      "attrs": {"task_id": event:attr("task_id"), "n": n, "primes": primes}
    })
    always {
      raise wrangler event "ready_for_deletion"
    }
  }
}
