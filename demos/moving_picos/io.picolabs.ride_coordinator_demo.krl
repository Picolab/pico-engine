ruleset io.picolabs.ride_coordinator_demo {
  meta {
    name "Ride coordinator demo"
    description <<
      Portable-move demo setup for the Ride Coordinator mesh (install on the mesh root).

      Install via flush — host dev:
        file:///…/pico-engine/demos/io.picolabs.ride_coordinator_demo.krl
      Docker (docker-compose.cross-engine.yml):
        file:///var/pico-demos/moving_picos/io.picolabs.ride_coordinator_demo.krl

      On install, creates a tagged demo channel (see demoState().demoEci). Raise setup,
      sync, and cleanup on that channel — root default channels are too restrictive.

      Setup — creates Ride Participants and opens a Layer 2 subscription to the bike
      (bikeDid required; bikeName optional for Relationships tab label). Setup stops at
      stage "connecting" — do not query
      the bike during setup (cross-engine deadlock with sky_intro).

      If the coordinator↔bike Layer 2 relationship already exists before export, it
      should survive import (identity snapshot + SKY rotate + local peer reconcile) —
      you only need setup/approve when forming a **new** relationship after import.

      Manifold thing picos do not auto-accept **new** inbound relationships. When
      setup is required, on the imported bike (thingQueryEci from import_portable_thing_done):
        1. Query io.picolabs.subscription:inbound() for pending "Ride Participants:…".
        2. raise wrangler event "pending_subscription_approval" attributes { "Id": "<Id>" }.

      After approving the pending sub on the bike, raise ride_coordinator_demo event "sync"
      on the demo channel (not listed in Testing — internal checkpoint; use Events or schedule).

      Query ride_coordinator_demo:demoState() when ready is true (stage "done").
      After cleanup, demoState() returns only stage "idle" and demoEci.
      raise ride_coordinator_demo event "cleanup" to reset (discovers orphaned
      Ride Participants children by name).
    >>
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares demoState
  }

  global {
    __testing = {
      "queries": [
        {"name": "demoState"}
      ],
      "events": [
        {
          "domain": "ride_coordinator_demo",
          "name": "setup",
          "attrs": ["bikeDid", "bikeName"]
        },
        {"domain": "ride_coordinator_demo", "name": "cleanup"}
      ]
    }

    DEMO_CHANNEL_TAG = "ride_coordinator_demo"
    PARTICIPANTS_NAME = "Ride Participants"

    coordinatorLinkName = function(bikeName) {
      label = bikeName.defaultsTo("bike")
      PARTICIPANTS_NAME + ":" + label
    }

    demoEventPolicy = {
      "allow": [
        {"domain": "ride_coordinator_demo", "name": "*"},
        {"domain": "wrangler", "name": "new_child_created"},
        {"domain": "wrangler", "name": "new_child_request"},
        {"domain": "wrangler", "name": "child_deletion_request"},
        {"domain": "wrangler", "name": "child_deleted"}
      ],
      "deny": []
    }

    demoQueryPolicy = {
      "allow": [{"rid": "*", "name": "*"}],
      "deny": []
    }

    subscriptionEstablished = function() {
      wrangler:picoQuery(
        ent:participants_eci,
        "io.picolabs.subscription",
        "established",
        {}
      )
        .filter(function(row) {
          row{"Rx_role"} == "bike"
            && row{"Tx_role"} == "ride_coordinator"
            && row{"layer2"} == true
        })
        .length() > 0
    }

    participantsChildEci = function() {
      wrangler:children()
        .filter(function(child) { child{"name"} == PARTICIPANTS_NAME })
        .head()
        {"eci"}
    }

    participantsTargetEci = function() {
      participantsChildEci()
        .defaultsTo(ent:participants_eci)
        .defaultsTo(ent:cleanup_participants_eci)
    }

    demoState = function() {
      stage = ent:stage.defaultsTo("idle")
      stage == "idle" =>
        { "stage": "idle", "demoEci": ent:demo_eci } |
      {
        "ready": ent:ready == true,
        "stage": stage,
        "runId": ent:run_id,
        "demoEci": ent:demo_eci,
        "participantsEci": ent:participants_eci,
        "participantsUiEci": ent:participants_ui_eci,
        "bikeDid": ent:bike_did,
        "bikeName": ent:bike_name,
        "cleanupParticipantsEci": ent:cleanup_participants_eci,
        "subscriptionName": coordinatorLinkName(ent:bike_name)
      }
    }
  }

  rule ensure_demo_channel {
    select when wrangler ruleset_installed or engine started
    where event:attr("rids").isnull() || event:attr("rids") >< meta:rid
    pre {
      demo_eci = wrangler:channels(DEMO_CHANNEL_TAG).head(){"id"}
    }
    if demo_eci.isnull() then every {
      ctx:newChannel(
        [DEMO_CHANNEL_TAG],
        demoEventPolicy,
        demoQueryPolicy
      ) setting(new_channel)
    }
    fired {
      ent:demo_eci := new_channel{"id"}
    } else {
      ent:demo_eci := demo_eci
    }
  }

  rule setup_clear {
    select when ride_coordinator_demo setup
    where ent:stage.isnull() || ent:stage == "idle"
    schedule:clear()
  }

  rule setup {
    select when ride_coordinator_demo setup
    where ent:stage.isnull() || ent:stage == "idle"
    pre {
      bike_did = event:attr("bikeDid")
      bike_name = event:attr("bikeName")
    }
    fired {
      ent:run_id := ent:run_id.defaultsTo(0) + 1
      ent:demoHost := true
      ent:ready := false
      ent:stage := "creating"
      ent:bike_did := bike_did
      ent:bike_name := bike_name
      ent:participants_eci := null
      ent:participants_ui_eci := null
      raise wrangler event "new_child_request" attributes {
        "name": PARTICIPANTS_NAME,
        "backgroundColor": "#C9A0DC"
      }
    }
  }

  rule on_participants_created {
    select when wrangler new_child_created
    where ent:demoHost == true
      && ent:stage == "creating"
      && event:attr("name") == PARTICIPANTS_NAME
    pre {
      logLine = {
        "participantsEci": event:attr("eci"),
        "bikeDid": ent:bike_did
      }.encode().klog("ride_coordinator_demo participants_created")
    }
    fired {
      ent:participants_eci := event:attr("eci")
      ent:participants_ui_eci := event:attr("uiEci")
      raise ride_coordinator_demo event "proceed_subscribe"
    }
  }

  rule proceed_subscribe {
    select when ride_coordinator_demo proceed_subscribe
    where ent:demoHost == true
      && ent:participants_eci
      && ent:bike_did
    pre {
      logLine = {
        "bikeDid": ent:bike_did,
        "participantsEci": ent:participants_eci
      }.encode().klog("ride_coordinator_demo proceed_subscribe")
    }
    if ent:bike_did then every {
      event:send({
        "eci": ent:participants_eci,
        "domain": "wrangler",
        "type": "subscription",
        "attrs": {
          "layer2": true,
          "target_did": ent:bike_did,
          "name": coordinatorLinkName(ent:bike_name),
          "Tx_role": "ride_coordinator",
          "Rx_role": "bike",
          "channel_type": "Tx_Rx"
        }
      })
    }
    fired {
      ent:stage := "connecting"
    }
  }

  rule finish_subscription {
    select when ride_coordinator_demo sync
    where ent:demoHost == true
      && ent:participants_eci
    pre {
      logLine = {
        "established": subscriptionEstablished(),
        "stage": ent:stage
      }.encode().klog("ride_coordinator_demo finish_subscription")
    }
    fired {
      ent:ready := subscriptionEstablished()
      ent:stage := ent:ready == true => "done" | "connecting"
      raise ride_coordinator_demo event "ready" attributes demoState()
        if ent:ready == true
    }
  }

  rule cleanup_clear {
    select when ride_coordinator_demo cleanup
    schedule:clear()
  }

  rule cleanup {
    select when ride_coordinator_demo cleanup
    fired {
      raise ride_coordinator_demo event "cleanup_go"
    }
  }

  rule cleanup_go {
    select when ride_coordinator_demo cleanup_go
    pre {
      target_eci = participantsTargetEci()
      logLine = {
        "targetEci": target_eci,
        "discoveredEci": participantsChildEci(),
        "stage": ent:stage
      }.encode().klog("ride_coordinator_demo cleanup start")
    }
    if target_eci then every {
      event:send({
        "eci": target_eci,
        "domain": "wrangler",
        "type": "cancel_subscriptions",
        "attrs": {}
      })
    }
    fired {
      ent:stage := "cleaning"
      ent:demoHost := null
      ent:ready := null
      ent:participants_eci := null
      ent:participants_ui_eci := null
      ent:bike_did := null
      ent:bike_name := null
      ent:cleanup_participants_eci := target_eci
      raise wrangler event "child_deletion_request" attributes {
        "eci": target_eci
      }
    }
  }

  rule cleanup_go_none {
    select when ride_coordinator_demo cleanup_go
    pre {
      target_eci = participantsTargetEci()
    }
    if target_eci.isnull() then every {
      noop()
    }
    fired {
      raise ride_coordinator_demo event "cleanup_finish"
    }
  }

  rule on_participants_deleted {
    select when wrangler child_deleted
    where ent:stage == "cleaning"
      && ent:cleanup_participants_eci
      && event:attr("eci") == ent:cleanup_participants_eci
    pre {
      logLine = event:attrs.encode().klog("ride_coordinator_demo participants_deleted")
    }
    fired {
      raise ride_coordinator_demo event "cleanup_finish"
    }
  }

  rule cleanup_finish {
    select when ride_coordinator_demo cleanup_finish
    fired {
      ent:stage := "idle"
      ent:demoHost := null
      ent:ready := null
      ent:run_id := null
      ent:participants_eci := null
      ent:participants_ui_eci := null
      ent:bike_did := null
      ent:bike_name := null
      ent:cleanup_participants_eci := null
    }
  }
}
