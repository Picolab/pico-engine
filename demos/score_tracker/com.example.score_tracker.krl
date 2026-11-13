/**
 * Score tracker: one pico per contest. People register with a first and last
 * name and get a participant id, then send points with a description. The
 * leaderboard ranks everyone by total.
 *
 * The app channel allows only score events and this ruleset's queries, so a
 * contestant holding that channel can register and add points but cannot, for
 * example, create child picos or install rulesets.
 */
ruleset com.example.score_tracker {
  meta {
    name "Score tracker"
    description "Keeps contestants' points and ranks them on a leaderboard."
    author "PICOLABS"

    use module io.picolabs.xmlui alias ui

    shares currentRanks, participant, leaderboard
  }

  global {
    channel_tags = ["score_tracker", "app"]

    totalOf = function(p) {
      p{"points"}.defaultsTo([])
        .map(function(entry) { entry{"points"} })
        .reduce(function(a, b) { a + b }, 0)
    }

    findByName = function(first, last) {
      ent:participants.defaultsTo({}).values()
        .filter(function(p) { p{"first"} == first && p{"last"} == last })
        .head()
    }

    /**
     * Everyone, highest total first, with a rank.
     * @returns Array of { rank, pid, name, total, entries }
     */
    currentRanks = function() {
      ent:participants.defaultsTo({}).values()
        .map(function(p) {
          {
            "pid": p{"pid"},
            "name": p{"first"} + " " + p{"last"},
            "total": totalOf(p),
            "entries": p{"points"}.defaultsTo([]).length()
          }
        })
        .sort(function(a, b) { b{"total"} <=> a{"total"} })
        .map(function(row, i) { row.put("rank", i + 1) })
    }

    /**
     * One participant, with every entry.
     * @param pid String "participant id"
     * @returns Map
     */
    participant = function(pid) {
      ent:participants{pid}
    }

    /**
     * The leaderboard, with forms to register and to add points.
     * @view "Leaderboard"
     */
    leaderboard = function() {
      ranks_url = ui:query_url("currentRanks", meta:rid, meta:eci)
      register_url = ui:event_url("score", "new_participant")
      points_url = ui:event_url("score", "new_points")
      <<
<Component name="Leaderboard"
           var.pid="{sessionStorage.getItem('scoreTrackerPid')}"
           var.me="{sessionStorage.getItem('scoreTrackerName')}">
  <DataSource id="ranks" url="#{ranks_url}" headers="{appGlobals.auth}" />
  <APICall id="register" method="post" url="#{register_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="(result) => { pid = result.directives[0].options.pid; me = result.directives[0].options.name; sessionStorage.setItem('scoreTrackerPid', pid); sessionStorage.setItem('scoreTrackerName', me); ranks.refetch(); }" />
  <APICall id="addPoints" method="post" url="#{points_url}" headers="{appGlobals.auth}" body="{$param}"
           onSuccess="ranks.refetch()" />
  <PicoTheme>
    <Card title="Leaderboard" subtitle="{pid ? 'You are ' + me + '.' : 'Register to add points.'}" />
    <Table data="{ranks}">
      <Column bindTo="rank" header="Rank" />
      <Column bindTo="name" header="Name" />
      <Column bindTo="total" header="Points" />
      <Column bindTo="entries" header="Entries" />
    </Table>
    <Form when="{!pid}" saveLabel="Register"
          onSubmit="(data) => register.execute({first: data.firstName, last: data.lastName})">
      <FormItem bindTo="firstName" label="First name" required="true" />
      <FormItem bindTo="lastName" label="Last name" required="true" />
    </Form>
    <Form when="{pid}" saveLabel="Add points"
          onSubmit="(data) => addPoints.execute({pid: pid, points: data.points, descr: data.descr})">
      <FormItem bindTo="points" label="Points" type="integer" initialValue="10" />
      <FormItem bindTo="descr" label="For" initialValue="Answered a question" />
    </Form>
  </PicoTheme>
</Component>
>>
    }
  }

  /**
   * Register a contestant. Someone already registered under the same name
   * gets their existing id back. The directive carries the id and name.
   * @attr first String "first name"
   * @attr last String "last name"
   * @attr pid String optional "use this id instead of a generated one (seeding, tests)"
   * @example "Ada" { "first": "Ada", "last": "Lovelace" }
   */
  rule new_participant {
    select when score new_participant
      first re#(.+)#
      last re#(.+)#
      setting(first, last)
    pre {
      existing = findByName(first, last)
      pid = existing => existing{"pid"} | event:attr("pid") || random:uuid()
    }
    send_directive("registered", {
      "pid": pid,
      "name": first + " " + last,
      "new": existing => false | true
    })
    always {
      ent:participants{pid} := {"pid": pid, "first": first, "last": last, "points": []}
        if not existing
    }
  }

  /**
   * Add points for a registered contestant.
   * @attr pid String "participant id from new_participant"
   * @attr points Number "points to add (may be negative)"
   * @attr descr String optional "what the points are for"
   * @example "ten points" { "pid": "<pid>", "points": "10", "descr": "Answered a question" }
   */
  rule new_points {
    select when score new_points
      pid re#(.+)#
      points re#^(-?\d+)$#
      setting(pid, points)
    pre {
      p = ent:participants{pid}
      descr = event:attr("descr") || "points"
    }
    if p then send_directive("points_added", {"pid": pid, "points": points.as("Number")})
    fired {
      ent:participants{[pid, "points"]} := p{"points"}.defaultsTo([])
        .append({"points": points.as("Number"), "descr": descr, "time": time:now()})
    }
    else {
      error warn <<score new_points: no participant #{pid}>>
    }
  }

  rule create_app_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    ui:create_app_channel(channel_tags, ["score"], ["currentRanks", "participant", "leaderboard"], meta:rid)
  }
}
