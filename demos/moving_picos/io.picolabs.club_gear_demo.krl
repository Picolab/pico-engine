ruleset io.picolabs.club_gear_demo {
  meta {
    name "Club gear demo"
    description <<
      Donor-side portable-move demo (install only on Engine A / source Manifold).

      Creates Trail Ride Community, Gravel Bike #7 (move target), Gravel Bike #3,
      bike-computer children, and community links on Engine A.

      Donor: raise club_gear_demo event "setup"; poll demoState() until ready.
      Export on the Manifold app pico (after enable_portable_thing):
        manifold_portable_thing:exportPortableThing(subtreeRootPicoId, secret)
      Use demoState().bikePicoId or bikeEci as subtreeRootPicoId; copy blob + donorQueryEci to B.
      After import on B, raise release_bike7 on A to drop the donor bike from Manifold.

      Recipient (Engine B): standard Manifold bootstrap only — no club_gear_demo.
      On the Manifold app pico:
        raise manifold event "enable_portable_thing"
        raise manifold event "import_portable_thing"
          attributes { "blob", "secret", "name", "donorQueryEci", "renewIngress" }

      Optional on B: if coordinator↔bike Layer 2 was linked before export, import
      preserves it; otherwise ride_coordinator_demo setup (bikeDid) → approve on bike → sync.

      Install donor RS: file:///var/pico-demos/moving_picos/io.picolabs.club_gear_demo.krl
    >>
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler
    use module io.picolabs.manifold_pico alias manifold_pico

    shares demoState
  }

  global {
    __testing = {
      "queries": [
        {"name": "demoState"}
      ],
      "events": [
        {"domain": "club_gear_demo", "name": "setup"},
        {"domain": "club_gear_demo", "name": "release_bike7"},
        {"domain": "club_gear_demo", "name": "cleanup"}
      ]
    }

    COMMUNITY_NAME = "Trail Ride Community"
    BIKE7_NAME = "Gravel Bike #7"
    BIKE3_NAME = "Gravel Bike #3"
    BIKE7_COMPUTER_NAME = "Bike #7 Computer"
    BIKE3_COMPUTER_NAME = "Bike #3 Computer"
    BIKE7_RCN = "bike7"
    BIKE3_RCN = "bike3"
    COMMUNITY_RCN = "community"
    COORDINATOR_SUB_NAME = "coordinator-to-bike"
    COORDINATOR_TX_ROLE = "ride_coordinator"

    callbackEventPolicy = {
      "allow": [
        {"domain": "community", "name": "thing_created"},
        {"domain": "community", "name": "thing_completed"},
        {"domain": "community", "name": "community_completed"}
      ],
      "deny": []
    }

    callbackQueryPolicy = {
      "allow": [{"rid": "*", "name": "*"}],
      "deny": []
    }

    /** Manifold registry keys from setup callbacks (manifoldKey = thingPicoID). */
    manifoldThingIdsFromBikes = function(bikes) {
      b = bikes.defaultsTo({})
      id7 = b{BIKE7_RCN}{"manifoldKey"}.defaultsTo(b{BIKE7_RCN}{"picoID"})
      id3 = b{BIKE3_RCN}{"manifoldKey"}.defaultsTo(b{BIKE3_RCN}{"picoID"})
      id7.isnull() && id3.isnull() => []
        | id7.isnull() => [id3]
        | id3.isnull() => [id7]
        | [id7, id3]
    }

    /** Live registry keys for demo gravel bikes (cleanup when ent state is stale). */
    demoThingIdsFromManifold = function() {
      things = manifold_pico:getThings()
      things.keys().filter(function(k) {
        nm = things{k}{"name"}
        nm == BIKE7_NAME || nm == BIKE3_NAME
      })
    }

    demoCommunityRegistryKey = function() {
      comms = manifold_pico:getCommunities()
      comms.keys().filter(function(k) {
        comms{k}{"name"} == COMMUNITY_NAME
      }).head()
    }

    allCleanupThingIds = function() {
      demoThingIdsFromManifold()
        .append(ent:cleanup_bike_ids.defaultsTo([]))
        .append(manifoldThingIdsFromBikes(ent:bikes.defaultsTo({})))
    }

    cleanupCommunityId = function() {
      ent:cleanup_community_id
        .defaultsTo(ent:community_pico_id)
        .defaultsTo(demoCommunityRegistryKey())
    }

    allAssetsReady = function() {
      ent:community_ready == true
        && ent:bike7_ready == true
        && ent:bike3_ready == true
    }

    demoState = function() {
      {
        "ready": ent:ready.defaultsTo(false),
        "stage": ent:stage.defaultsTo("idle"),
        "moveStage": ent:move_stage.defaultsTo("idle"),
        "runId": ent:run_id,
        "callbackEci": ent:callback_eci,
        "communityEci": ent:community_query_eci,
        "communityPicoId": ent:community_pico_id,
        "communityUiEci": ent:community_ui_eci,
        "bikeEci": ent:bike_query_eci,
        "bikePicoId": ent:bike_pico_id,
        "bikeManifoldKey": ent:bike_manifold_key,
        "bikeUiEci": ent:bike_ui_eci,
        "bikeDid": ent:bike_did,
        "bikeComputerEci": ent:bike_computer_eci,
        "bike2Eci": ent:bike2_query_eci,
        "bike2PicoId": ent:bike2_pico_id,
        "bike2ComputerEci": ent:bike2_computer_eci,
        "bikes": ent:bikes,
        "cleanupCommunityId": ent:cleanup_community_id,
        "cleanupUnlinkQueue": ent:cleanup_unlink_queue,
        "cleanupRemoveQueue": ent:cleanup_remove_queue
      }
    }
  }

  rule setup_clear {
    select when club_gear_demo setup
    where ent:stage.isnull()
      || ent:stage == "idle"
      || ent:stage == "bike_released"
      || ent:stage == "done"
    schedule:clear()
  }

  rule setup {
    select when club_gear_demo setup
    where ent:stage.isnull()
      || ent:stage == "idle"
      || ent:stage == "bike_released"
      || ent:stage == "done"
    pre {
      callback_eci = wrangler:channels("manifold_callback").head(){"id"}
    }
    if callback_eci.isnull() then every {
      ctx:newChannel(
        ["manifold_callback"],
        callbackEventPolicy,
        callbackQueryPolicy
      ) setting(new_channel)
    }
    fired {
      ent:callback_eci := new_channel{"id"}
      raise club_gear_demo event "setup_go"
    } else {
      ent:callback_eci := callback_eci
      raise club_gear_demo event "setup_go"
    }
  }

  rule setup_go {
    select when club_gear_demo setup_go
    where ent:callback_eci
      && (ent:stage.isnull()
        || ent:stage == "idle"
        || ent:stage == "bike_released"
        || ent:stage == "done")
    fired {
      ent:run_id := ent:run_id.defaultsTo(0) + 1
      ent:demoHost := true
      ent:ready := false
      ent:stage := "creating"
      ent:move_stage := "idle"
      ent:community_ready := false
      ent:bike7_ready := false
      ent:bike3_ready := false
      ent:bikes := {}
      ent:community_pico_id := null
      ent:community_query_eci := null
      ent:community_ui_eci := null
      ent:bike_pico_id := null
      ent:bike_manifold_key := null
      ent:bike_query_eci := null
      ent:bike_ui_eci := null
      ent:bike_did := null
      ent:bike_computer_eci := null
      ent:bike2_pico_id := null
      ent:bike2_query_eci := null
      ent:bike2_computer_eci := null
      ent:proceed_started := null
      ent:proceed_install_armed := null
      ent:computers_created := null
      ent:proceed_finish_done := null
      ent:cleanup_community_id := null
      ent:cleanup_unlink_queue := []
      ent:cleanup_remove_queue := []
      raise manifold event "new_community" attributes {
        "name": COMMUNITY_NAME,
        "description": "Club trail ride community",
        "callback_eci": ent:callback_eci,
        "rcn": COMMUNITY_RCN
      }
      raise manifold event "create_thing" attributes {
        "name": BIKE7_NAME,
        "callback_eci": ent:callback_eci,
        "rcn": BIKE7_RCN
      }
      raise manifold event "create_thing" attributes {
        "name": BIKE3_NAME,
        "callback_eci": ent:callback_eci,
        "rcn": BIKE3_RCN
      }
    }
  }

  rule on_thing_completed_bike7 {
    select when community thing_completed
    where ent:demoHost == true
      && ent:stage == "creating"
      && event:attr("rcn") == BIKE7_RCN
    pre {
      wrangler_id = event:attr("thingWranglerId")
        .defaultsTo(event:attr("thingPicoID"))
      bikeInfo = {
        "rcn": BIKE7_RCN,
        "name": BIKE7_NAME,
        "manifoldKey": event:attr("thingPicoID"),
        "picoID": wrangler_id,
        "query_eci": event:attr("thing_eci")
      }
      logLine = bikeInfo.encode().klog("club_gear_demo thing_completed")
    }
    fired {
      ent:bikes := ent:bikes.defaultsTo({})
      ent:bikes{BIKE7_RCN} := bikeInfo
      ent:bike7_ready := true
      ent:bike_query_eci := event:attr("thing_eci")
      ent:bike_pico_id := wrangler_id
      ent:bike_manifold_key := event:attr("thingPicoID")
    }
  }

  rule on_thing_completed_bike3 {
    select when community thing_completed
    where ent:demoHost == true
      && ent:stage == "creating"
      && event:attr("rcn") == BIKE3_RCN
    pre {
      wrangler_id = event:attr("thingWranglerId")
        .defaultsTo(event:attr("thingPicoID"))
      bikeInfo = {
        "rcn": BIKE3_RCN,
        "name": BIKE3_NAME,
        "manifoldKey": event:attr("thingPicoID"),
        "picoID": wrangler_id,
        "query_eci": event:attr("thing_eci")
      }
      logLine = bikeInfo.encode().klog("club_gear_demo thing_completed")
    }
    fired {
      ent:bikes := ent:bikes.defaultsTo({})
      ent:bikes{BIKE3_RCN} := bikeInfo
      ent:bike3_ready := true
      ent:bike2_query_eci := event:attr("thing_eci")
      ent:bike2_pico_id := wrangler_id
    }
  }

  rule on_community_completed {
    select when community community_completed
    where ent:demoHost == true
      && ent:stage == "creating"
      && event:attr("rcn") == COMMUNITY_RCN
    pre {
      communityInfo = {
        "rcn": COMMUNITY_RCN,
        "name": COMMUNITY_NAME,
        "picoID": event:attr("communityPicoID"),
        "query_eci": event:attr("community_eci")
      }
      logLine = communityInfo.encode().klog("club_gear_demo community_completed")
    }
    fired {
      ent:community_query_eci := event:attr("community_eci")
      ent:community_pico_id := event:attr("communityPicoID")
      ent:community_ready := true
    }
  }

  rule proceed_begin {
    select when community thing_completed or community community_completed
    where ent:demoHost == true
      && ent:stage == "creating"
      && allAssetsReady()
      && ent:proceed_started != true
    fired {
      ent:proceed_started := true
      schedule club_gear_demo event "proceed_install" at time:add(time:now(), {"seconds": 1})
    }
  }

  rule proceed_install_arm {
    select when club_gear_demo proceed_install
    where ent:stage == "creating"
      && ent:proceed_install_armed.isnull() == true
      && ent:bikes{BIKE7_RCN}{"query_eci"}
      && ent:bikes{BIKE7_RCN}{"manifoldKey"}
      && ent:bikes{BIKE3_RCN}{"query_eci"}
      && ent:bikes{BIKE3_RCN}{"manifoldKey"}
      && ent:community_pico_id
      && ent:bike_query_eci
    fired {
      ent:proceed_install_armed := true
      ent:stage := "installing"
      ent:computers_created := false
    }
  }

  rule proceed_install_computer7 {
    select when club_gear_demo proceed_install
    where ent:stage == "installing"
      && ent:computers_created != true
      && ent:bikes{BIKE7_RCN}{"query_eci"}
    pre {
      eci7 = ent:bikes{BIKE7_RCN}{"query_eci"}
      kids7 = eci7 => wrangler:picoQuery(eci7, "io.picolabs.wrangler", "children", {}) | []
      need7 = kids7.typeof() == "Array"
        && kids7.filter(function(c) { c{"name"} == BIKE7_COMPUTER_NAME }).length() == 0
    }
    if need7 && eci7 then every {
      event:send({
        "eci": eci7,
        "domain": "wrangler",
        "type": "new_child_request",
        "attrs": {
          "name": BIKE7_COMPUTER_NAME,
          "backgroundColor": "#FFD1DC"
        }
      })
    }
  }

  rule proceed_install_computer3 {
    select when club_gear_demo proceed_install
    where ent:stage == "installing"
      && ent:computers_created != true
      && ent:bikes{BIKE3_RCN}{"query_eci"}
    pre {
      eci3 = ent:bikes{BIKE3_RCN}{"query_eci"}
      kids3 = eci3 => wrangler:picoQuery(eci3, "io.picolabs.wrangler", "children", {}) | []
      need3 = kids3.typeof() == "Array"
        && kids3.filter(function(c) { c{"name"} == BIKE3_COMPUTER_NAME }).length() == 0
    }
    if need3 && eci3 then every {
      event:send({
        "eci": eci3,
        "domain": "wrangler",
        "type": "new_child_request",
        "attrs": {
          "name": BIKE3_COMPUTER_NAME,
          "backgroundColor": "#C9A0DC"
        }
      })
    }
  }

  rule proceed_install_intro7 {
    select when club_gear_demo proceed_install
    where ent:stage == "installing"
      && ent:computers_created != true
      && ent:bikes{BIKE7_RCN}{"query_eci"}
    if ent:bikes{BIKE7_RCN}{"query_eci"} then every {
      event:send({
        "eci": ent:bikes{BIKE7_RCN}{"query_eci"},
        "domain": "wrangler",
        "type": "set_public_intro",
        "attrs": { "enabled": true }
      })
    }
    fired {
      ent:computers_created := true
      raise club_gear_demo event "proceed_install_finish"
    }
  }

  rule proceed_install_finish {
    select when club_gear_demo proceed_install_finish
    where ent:stage == "installing"
      && ent:proceed_install_armed == true
      && ent:proceed_finish_done != true
    fired {
      ent:proceed_finish_done := true
      raise manifold event "add_thing_to_community" attributes {
        "thingPicoID": ent:bikes{BIKE7_RCN}{"manifoldKey"},
        "communityPicoID": ent:community_pico_id
      }
      raise manifold event "add_thing_to_community" attributes {
        "thingPicoID": ent:bikes{BIKE3_RCN}{"manifoldKey"},
        "communityPicoID": ent:community_pico_id
      }
      ent:bike_did := ctx:query(
        ent:bike_query_eci,
        "io.picolabs.wrangler",
        "myDid"
      )
      ent:ready := true
      ent:stage := "done"
      ent:cleanup_community_id := ent:community_pico_id
      ent:cleanup_bike_ids := manifoldThingIdsFromBikes(ent:bikes)
      raise club_gear_demo event "ready" attributes demoState()
    }
  }

  rule release_bike7 {
    select when club_gear_demo release_bike7
    where ent:bike_manifold_key.isnull() == false
      || ent:bikes.defaultsTo({}){BIKE7_RCN}{"manifoldKey"}.isnull() == false
    pre {
      bike_key = ent:bike_manifold_key
        .defaultsTo(ent:bikes.defaultsTo({}){BIKE7_RCN}{"manifoldKey"})
      logLine = {
        "bikeManifoldKey": bike_key,
        "bikePicoId": ent:bike_pico_id,
        "communityPicoId": ent:community_pico_id
      }.encode().klog("club_gear_demo release_bike7")
    }
    fired {
      ent:move_stage := "releasing"
      raise manifold event "remove_thing_from_community" attributes {
        "thingPicoID": bike_key,
        "communityPicoID": ent:community_pico_id
      } if bike_key && ent:community_pico_id
      raise club_gear_demo event "release_bike7_remove"
        attributes { "bikeManifoldKey": bike_key }
    }
  }

  rule release_bike7_remove {
    select when club_gear_demo release_bike7_remove
    pre {
      bike_key = event:attr("bikeManifoldKey")
        .defaultsTo(ent:bike_manifold_key)
        .defaultsTo(ent:bikes.defaultsTo({}){BIKE7_RCN}{"manifoldKey"})
    }
    fired {
      raise manifold event "remove_thing" attributes {
        "picoID": bike_key
      } if bike_key
      ent:move_stage := "released"
      ent:bike_manifold_key := null
      ent:bike_pico_id := null
      ent:bike_query_eci := null
      ent:bike_ui_eci := null
      ent:bike_did := null
      ent:bike_computer_eci := null
      ent:bike7_ready := null
      ent:bikes := ent:bikes.delete(BIKE7_RCN)
      ent:ready := false
      ent:stage := "bike_released"
    }
  }

  rule cleanup {
    select when club_gear_demo cleanup
    where ent:stage.isnull()
      || ent:stage == "idle"
      || ent:stage == "done"
      || ent:stage == "bike_released"
      || ent:stage == "creating"
      || ent:stage == "installing"
      || ent:stage == "cleaning"
    fired {
      raise club_gear_demo event "cleanup_resume"
        if ent:stage == "cleaning"
      raise club_gear_demo event "cleanup_go"
        if ent:stage != "cleaning"
    }
  }

  rule cleanup_resume {
    select when club_gear_demo cleanup_resume
    where ent:stage == "cleaning"
    fired {
      schedule club_gear_demo event "cleanup_unlink_step" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_unlink_queue.length() > 0 && ent:cleanup_community_id
      schedule club_gear_demo event "cleanup_remove_bike_step" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_unlink_queue.length() == 0
          && ent:cleanup_remove_queue.length() > 0
      schedule club_gear_demo event "cleanup_remove_community" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_unlink_queue.length() == 0
          && ent:cleanup_remove_queue.length() == 0
          && ent:cleanup_community_id
      raise club_gear_demo event "cleanup_finish"
        if ent:cleanup_unlink_queue.length() == 0
          && ent:cleanup_remove_queue.length() == 0
          && ent:cleanup_community_id.isnull()
    }
  }

  rule cleanup_go {
    select when club_gear_demo cleanup_go
    pre {
      bike_ids = allCleanupThingIds()
      community_id = cleanupCommunityId()
      logLine = {
        "bikeIds": bike_ids,
        "communityId": community_id
      }.encode().klog("club_gear_demo cleanup start")
    }
    fired {
      ent:run_id := ent:run_id.defaultsTo(0) + 1
      ent:stage := "cleaning"
      ent:demoHost := null
      ent:ready := null
      ent:community_ready := null
      ent:bike7_ready := null
      ent:bike3_ready := null
      ent:community_query_eci := null
      ent:community_ui_eci := null
      ent:bike_query_eci := null
      ent:bike_ui_eci := null
      ent:bike_did := null
      ent:bike_computer_eci := null
      ent:bike2_query_eci := null
      ent:bike2_computer_eci := null
      ent:cleanup_community_id := community_id
      ent:cleanup_unlink_queue := bike_ids
      ent:cleanup_remove_queue := bike_ids
      schedule club_gear_demo event "cleanup_unlink_step" at time:add(time:now(), {"seconds": 1})
        if community_id && bike_ids.length() > 0
      schedule club_gear_demo event "cleanup_remove_bike_step" at time:add(time:now(), {"seconds": 1})
        if community_id.isnull() && bike_ids.length() > 0
      raise club_gear_demo event "cleanup_remove_community"
        if bike_ids.length() == 0 && community_id
      raise club_gear_demo event "cleanup_finish"
        if bike_ids.length() == 0 && community_id.isnull()
    }
  }

  rule cleanup_unlink_step {
    select when club_gear_demo cleanup_unlink_step
    where ent:cleanup_unlink_queue.length() > 0
      && ent:cleanup_community_id
    pre {
      thing_key = ent:cleanup_unlink_queue.head()
      logLine = { "thingRegistryKey": thing_key, "communityPicoID": ent:cleanup_community_id }
        .encode().klog("club_gear_demo cleanup unlink")
    }
    fired {
      raise manifold event "remove_thing_from_community" attributes {
        "thingPicoID": thing_key,
        "communityPicoID": ent:cleanup_community_id
      } if thing_key && ent:cleanup_community_id
      ent:cleanup_unlink_queue := ent:cleanup_unlink_queue.tail()
      schedule club_gear_demo event "cleanup_unlink_step" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_unlink_queue.length() > 0 && ent:cleanup_community_id
      schedule club_gear_demo event "cleanup_remove_bike_step" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_unlink_queue.length() == 0 && ent:cleanup_remove_queue.length() > 0
    }
  }

  rule cleanup_remove_bike_step {
    select when club_gear_demo cleanup_remove_bike_step
    where ent:cleanup_remove_queue.length() > 0
    pre {
      thing_key = ent:cleanup_remove_queue.head()
      logLine = { "thingRegistryKey": thing_key }.encode().klog("club_gear_demo cleanup remove bike")
    }
    fired {
      raise manifold event "remove_thing" attributes {
        "picoID": thing_key
      } if thing_key
      ent:cleanup_remove_queue := ent:cleanup_remove_queue.tail()
      schedule club_gear_demo event "cleanup_remove_bike_step" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_remove_queue.length() > 0
      schedule club_gear_demo event "cleanup_remove_community" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_remove_queue.length() == 0 && ent:cleanup_community_id
      schedule club_gear_demo event "cleanup_finish" at time:add(time:now(), {"seconds": 1})
        if ent:cleanup_remove_queue.length() == 0 && ent:cleanup_community_id.isnull()
    }
  }

  rule cleanup_remove_community {
    select when club_gear_demo cleanup_remove_community
    where ent:cleanup_remove_queue.length() == 0
      && ent:cleanup_community_id
    pre {
      logLine = { "communityPicoID": ent:cleanup_community_id }
        .encode().klog("club_gear_demo cleanup remove community")
    }
    fired {
      raise manifold event "remove_community" attributes {
        "picoID": ent:cleanup_community_id
      } if ent:cleanup_community_id
      schedule club_gear_demo event "cleanup_finish" at time:add(time:now(), {"seconds": 2})
    }
  }

  rule cleanup_finish {
    select when club_gear_demo cleanup_finish
    fired {
      ent:stage := "idle"
      ent:demoHost := null
      ent:ready := null
      ent:callback_eci := null
      ent:proceed_started := null
      ent:proceed_install_armed := null
      ent:computers_created := null
      ent:proceed_finish_done := null
      ent:community_ready := null
      ent:bike7_ready := null
      ent:bike3_ready := null
      ent:bikes := null
      ent:community_pico_id := null
      ent:community_query_eci := null
      ent:community_ui_eci := null
      ent:bike_pico_id := null
      ent:bike_manifold_key := null
      ent:bike_query_eci := null
      ent:bike_ui_eci := null
      ent:bike_did := null
      ent:bike_computer_eci := null
      ent:bike2_pico_id := null
      ent:bike2_query_eci := null
      ent:bike2_computer_eci := null
      ent:cleanup_community_id := null
      ent:cleanup_bike_ids := null
      ent:cleanup_unlink_queue := null
      ent:cleanup_remove_queue := null
      ent:move_stage := null
    }
  }
}
