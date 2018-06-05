ruleset tedrub.modulos.observer {
  meta {
    shares __testing, resources, observers,engines
    use module io.picolabs.subscription alias subscription
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },{ "name": "observers" },{ "name": "resources" },{ "name": "engines" } ],
                  "events": [ 
                  { "domain": "discover", "type": "addResource","attrs": [ "name" ] },
                  { "domain": "discover", "type": "removeResource","attrs": [ "name" ] },
                  { "domain": "discover", "type": "addObserver","attrs": [] },
                  { "domain": "discover", "type": "clear_events","attrs": [] },
                  { "domain": "discover", "type": "removeObserver","attrs": [] } ] }
  
  lostEngines = function(){
    engines = engines().keys().head();
    ent:engine_ids_2_subs_ids.keys().difference(engines);
  }

  engines = function(){
    ent:engines;
  }

  observers = function(){
    ent:observers;
  }

  connections =function(){
    ent:connections;
  }

  resources = function(){
    ent:resources;
  }

  observerDid = function(){
    wrangler:channel("observer")
  }
  observer_Policy = { 
      "name": "observer",
      "event": {
          "allow": [
              {"domain": "wrangler", "type": "subscription"},
              {"domain": "wrangler", "type": "pending_subscription"},
              {"domain": "wrangler", "type": "pending_subscription_approval"},
              {"domain": "wrangler", "type": "subscription_cancellation"},
              {"domain": "discover", "type": "engine_lost"},
              {"domain": "discover", "type": "engine_found"}
          ]
      }
    }
    
  }

  rule _clear{ // clear all scheduled events and ... for testing.
    select when discover clear_events
    foreach schedule:list() setting (_event)
      schedule:remove(_event{"id"})
  }

  rule create_observer_DID{// ruleset constructor
    select when wrangler ruleset_added where rids >< meta:rid
    pre{ channel = observerDid() }
    if(channel.isnull() || channel{"type"} != "discover") then every{
      engine:newPolicy( observer_Policy ) setting(__observer_Policy)
      engine:newChannel(pico_id   = meta:picoId, 
                        name      = "observer", 
                        type      = "discover", 
                        policy_id = __observer_Policy{"id"}) setting(channel)
    }
    fired{
      raise wrangler event "addObserver" attributes event:attrs;
      ent:observer_Policy := __observer_Policy;
    }
    else{
      raise wrangler event "observer_not_created" attributes event:attrs; //exists
      raise wrangler event "addObserver" attributes event:attrs;
    }
  }

  rule remove_observer_DID{// ruleset destructor 
    select when wrangler removing_rulesets where rids >< meta:rid
    or wrangler intent_to_orphan
    pre{ channel = observerDid() }
    if(channel && channel{"type"} == "discover") then every{
      engine:removeChannel(channel{"id"}); 
    }
    always{
      //ent:observers := buses.splice(ent:observers.index(channel{"id"}),1);
      raise wrangler event "observer_removed" attributes event:attrs;// api
      raise discover event "remove_subs" attributes event:attrs; // clean up subscriptions
    }
  }

  rule resource_found{
    select when discover resource_found
      always{
        raise wrangler event "subscription" attributes {
                 "wellKnown_Tx": event:attr("resource"), 
                 "Tx_host"     : event:attr("Tx_host"),
                 "Rx_host"     : event:attr("Rx_host"),//"http://"+discover:ip()+":8080",
                 "engine_Id"   : event:attr("id") } 
      }
  }

// example of how to use resource_found
  rule engine_found{
    select when discover engine_found where advertisement{"resources"} >< "Temperature" 
      pre{ attrs = event:attrs.put({"resource" : event:attr("advertisement"){"resources"}{"Temperature"},
                   "Tx_host"    : "http://"+event:attr("address")+":8080"//event:attr("advertisement"){"_host"}
                   //,"Rx_host"    :
               })
      }
      always{
        raise discover event "resource_found" attributes attrs;
      }
  }

  rule new_resource {
    select when wrangler subscription_added
    if event:attr("engine_Id") then noop();
    fired {
      ent:connections := ent:connections.append(event:attr("Rx"));
      ent:engine_ids_2_subs_ids := ent:engine_ids_2_subs_ids.defaultsTo({}) 
                .put(event:attr("engine_Id"),
                    ent:engine_ids_2_subs_ids{event:attr("engine_Id")}.defaultsTo([])
                    .append(event:attr("Id"))
                );
    }
  }
  
  rule engine_lost{
    select when discover engine_lost
    foreach ent:engine_ids_2_subs_ids{event:attr("id")} setting(id)
    always{
      raise wrangler event "subscription_cancellation" attributes event:attrs.put("Id",id);
      ent:engine_ids_2_subs_ids := ent:engine_ids_2_subs_ids.delete([event:attr("id")]) on final;
    }
  }

  rule remove_subs{
    select when discover remove_subs
    foreach ent:engine_ids_2_subs_ids setting(subs)
      foreach subs setting(subId)
        always{
          raise wrangler event "subscription_cancellation" attributes event:attrs.put("Id",subId);
        }
  }

  rule clean_up{
    select when discover clean_up or
    discover engine_found or
    system online
    foreach lostEngines() setting(id)
    always{
      raise discover event "engine_lost" attributes {"id":id};
    }
  }

  rule addResource {
    select when discover addResource
      always{
        ent:resources := ent:resources.put([event:attr("name")],subscription:wellKnown_Rx(){"id"});
      }
  }

  rule removeResource {
    select when discover removeResource
      always{
        ent:resources := ent:resources.delete(event:attr("name"));
      }
  }

  rule addObserver {
    select when discover addObserver or
    system online 
      always{
        ent:observers := ent:observers.append(observerDid(){"id"});
      }
  }

  rule addedObserver {
    select when discover addObserver
    foreach engines().values() setting(engine)
    always{
      raise discover event "engine_found" attributes engine
    }
  }

  rule removeObserver {
    select when discover removeObserver
      always{
        ent:observers := observerDid(){"id"};
      }
  }

  //Accept the incoming subscription requests from other sensors.
  rule auto_accept {
    select when wrangler inbound_pending_subscription_added
    fired {
      raise wrangler event "pending_subscription_approval"
        attributes event:attrs
    }
  }
}