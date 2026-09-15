ruleset io.picolabs.subscription {
  meta {
    name "subscription "
    description <<
      Pico-to-pico relationships (Tx/Rx). User-facing term: relationship.
      Ruleset RID io.picolabs.subscription is stable; prefer module alias relationship.
    >>
    author "Tedrub Modulus"
    use module io.picolabs.wrangler alias wrangler
    provides established, outbound, inbound, wellKnown_Rx, autoAcceptConfig, queryOnSub
    shares   established, outbound, inbound, wellKnown_Rx, autoAcceptConfig, queryOnSub
    logging on
  }

  global{
    __testing = __testing
      .put("queries",__testing.get("queries").map(function(q){
        q.delete("args")
      }))
      .put("events",[
        { "domain": "wrangler", "name": "subscription",
          "attrs": [ "wellKnown_Tx","Rx_role","Tx_role","name","channel_type","Tx_host","password"] },
        { "domain": "wrangler", "name": "subscription",
          "attrs": [ "wellKnown_Tx","Rx_role","Tx_role","name","channel_type","password"] },
        { "domain": "wrangler", "name": "subscription",
          "attrs": [ "wellKnown_Tx","password"] },
        { "domain": "wrangler", "name": "subscription",
          "attrs": [ "wellKnown_Tx"] },
        { "domain": "wrangler", "name": "relationship",
          "attrs": [ "wellKnown_Tx","Rx_role","Tx_role","name","channel_type","Tx_host","password","layer2","target_did"] },
        { "domain": "wrangler", "name": "pending_subscription_approval",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "pending_relationship_approval",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "subscription_cancellation",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "relationship_cancellation",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "inbound_rejection",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "inbound_relationship_rejection",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "outbound_cancellation",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "outbound_relationship_cancellation",
          "attrs": [ "Id" ] },
        { "domain": "wrangler", "name": "autoAcceptConfigUpdate",
          "attrs": [ "configName", "password", "regexMap","delete" ] },
        { "domain": "wrangler", "name": "intent_to_delete",
          "attrs": [ "Id" ] },
      ])
/*
ent:inbound [
  {
    "Tx":"", //The channel identifier this pico will send events to
    "Rx":"", //The channel identifier this pico will be listening and receiving events on
    "Tx_role":"", //The subscription role or purpose that the pico on the other side of the subscription serves
    "Rx_role":"", //The role this pico serves, or this picos purpose in relation to the subscription
    "Tx_host": "", //the host location of the other pico if that pico is running on a separate engine
  },...,...
]

ent:outbound [
  {
    "wellKnown_Tx":"", //only in originating bus, the wellKnown is the original channel on which picos are introduced to each other.
    "Tx":"", //The channel identifier this pico will send events to
    "Rx":"", //The channel identifier this pico will be listening and receiving events on
    "Tx_role":"", //The subscription role or purpose that the pico on the other side of the subscription serves
    "Rx_role":"", //The role this pico serves, or this picos purpose in relation to the subscription
    "Tx_host": "" //the host location of the other pico if that pico is running on a separate engine
  },...,...
]

ent:established [
  {
    "Tx":"", // Legacy: remote channel ECI. Layer 2: use Tx_did instead.
    "Rx":"", // Internal Rx channel ECI (policy eval); not shared as address
    "Tx_did":"", // Layer 2: remote peer DID for outbound traffic
    "Rx_did":"", // Layer 2: local peer DID for this subscription
    "layer2": false, // true when formed via SKY intro (1.6+)
    "Tx_role":"",
    "Rx_role":"",
    "Tx_host": ""
  },...,...
]
*/

    allow_all_eventPolicy = {"allow":[{"domain":"*","name":"*"}],"deny":[]}
    allow_all_queryPolicy = {"allow":[{"rid":"*","name":"*"}],"deny":[]}
    wellKnown_eventPolicy = { // we need to restrict what attributes are allowed on this channel, specifically Id.
      "allow": [
          {"domain": "wrangler", "name": "subscription"},
          {"domain": "wrangler", "name": "relationship"},
          {"domain": "wrangler", "name": "new_subscription_request"},
          {"domain": "wrangler", "name": "inbound_removal"}
        ],
        "deny": []
    }
    wellKnown_queryPolicy = {
      "allow": [{"rid": ctx:rid, "name": "wellKnown_Rx"}],
      "deny": []
    }
    autoAcceptConfig = function(){
      ent:autoAcceptConfig.defaultsTo({})
    }
    configMatchesPassword = function(config, entryName, hashedPassword) {
      doesntExist = config{[entryName]}.isnull();
      passwordMatched = config{[entryName, "password"]} == hashedPassword;
      
      doesntExist || passwordMatched
    }
    
    established = function(key,value){
      filterOn(ent:established, key, value)
    }
    outbound = function(key,value){//Tx_Pending
      filterOn(ent:outbound, key, value)
    }
    inbound = function(key,value){//Rx_Pending
      filterOn(ent:inbound, key, value)
    }
    
    // Returns true if this pico has no relationships at the moment
    hasRelationships = function() {
      ent:established.defaultsTo([]).length() > 0
      || ent:inbound.defaultsTo([]).length() > 0
      || ent:outbound.defaultsTo([]).length() > 0
    }

    /**
    @param array, an array of maps
    @param [key], key in the map to filter on
    @param [value], the value at the given key to filter on
    @return an array of maps that contain the given key/value pair (if provided) from the array, defaulting to the original array if the key/value pair was not provided
    */
    filterOn = function(array, key, value){
      defaultedArray = array.defaultsTo([]);
      (key && value) => defaultedArray.filter(function(bus){ bus{key} == value}) | defaultedArray
    }

    wellKnown_Rx = function(){
      tags = ["wellKnown_Rx","Tx_Rx"]
      return wrangler:channels(tags).head()
    }

    /**
    @param buses, an array of subscriptions
    @param Id, a subscription id
    @return the index of the subscription in the array with the given id. -1 if it does not exist
    */
    indexOfId = function(buses, Id) {
      buses.map(function(bus){
        bus{"Id"}
      }).index(Id)
    }

    findBus = function(buses){
      event:attr("Id") => buses.filter( function(bus){ bus{"Id"} == event:attr("Id") }).head() |
        event:attr("Rx") => buses.filter( function(bus){ bus{"Rx"} == event:attr("Rx") }).head() |
          event:attr("Tx") => buses.filter( function(bus){ bus{"Tx"} == event:attr("Tx") }).head() |
            buses.filter( function(bus){ bus{"Rx"} == meta:eci }).head() ;
    }

    /**
     * Query a function on a remote pico via an established subscription.
     * Layer 2 subs use DIDComm / verified local dispatch; legacy subs use Tx ECI.
     */
    queryOnSub = function(subId, rid, name, args) {
      bus = established("Id", subId).head()
      bus.isnull() => null |
        bus{"layer2"} == true => dido:crossPicoQuery(subId, {
          "rid": rid,
          "name": name,
          "args": args.defaultsTo({})
        }) |
        wrangler:picoQuery(bus{"Tx"}, rid, name, args.defaultsTo({}), bus{"Tx_host"})
    }

    pending_entry = function(){
      host   = event:attr("Tx_host") == meta:host => null | event:attr("Tx_host")
      roles  = event:attr("Rx_role") => { // add possible roles
                  "Rx_role"      : event:attr("Rx_role"),
                  "Tx_role"      : event:attr("Tx_role")
                } | {};
      _roles = event:attr("Tx_host") => // add possible host
                roles.put(["Tx_host"] , host)  | roles;
      event:attr("Id") => // add subscription identifier
                 _roles.put(["Id"], event:attr("Id")) | _roles.put(["Id"], random:uuid())
    }
    
    doesConfigMatch = function(config) {
      config{["entries"]}.klog("entries map")
        .map(function(regs,k) { //See if any of its entries match with an event:attr and its key
          var = event:attr(k).klog("with event attr from " + k + "\n"); 
          matches = not var.isnull() => regs.map(function(regex_str){ 
                                              var.match(regex_str.as("RegExp").klog("matching with ")).klog("function returned ")})
                                            .any( function(bool){ bool == true }) 
                                        | false;
          matches }).klog("resulting map")
        .values()
        .any(function(bool){bool})
    }

  }//end global

  rule initialize{
    select when wrangler ruleset_installed where event:attr("rids") >< ctx:rid
    pre{ channel = wellKnown_Rx() }
    if channel.isnull() then noop()
    fired{
      raise wrangler event "need_wellKnown_Rx" attributes event:attrs;
    }
  }

  rule create_wellKnown_Rx{
    select when wrangler need_wellKnown_Rx
    every{
      ctx:newChannel(["wellKnown_Rx","Tx_Rx"], wellKnown_eventPolicy,wellKnown_queryPolicy)
    }
    fired{
      raise wrangler event "wellKnown_Rx_created" attributes event:attrs;
    }
  }

  rule create_root_pico_wellKnown_Rx{
    select when engine started
    pre{ channel = wellKnown_Rx() }
    if channel.isnull() then noop()
    fired{
      raise wrangler event "need_wellKnown_Rx" attributes event:attrs;
    }
  }
  
  rule register_for_cleanup {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    always {
      raise wrangler event "ruleset_needs_cleanup_period" attributes {
        "domain":meta:rid
      }
    }
  }
  
  
  rule cleanup_subscriptions {
    select when wrangler rulesets_need_to_cleanup
             or wrangler cleanup_relationships
    always {
      raise wrangler event "cancel_subscriptions" attributes event:attrs
    }
  }
  
  rule cancel_all_subscriptions {
    select when wrangler cancel_subscriptions
    pre {
      establishedSubIDs = ent:established.defaultsTo([]).map(function(sub){sub{"Id"}})
      inboundSubIDs = ent:inbound.defaultsTo([]).map(function(inSub){inSub{"Id"}})
      outboundSubIDs = ent:outbound.defaultsTo([]).map(function(outSub){outSub{"Id"}})
    }
    always {
    raise wrangler event "cancel_relationships" attributes event:attrs
                                                           .put("establishedIDs", establishedSubIDs)
                                                           .put("inboundIDs", inboundSubIDs)
                                                           .put("outboundIDs", outboundSubIDs)
  
    }      
  }
  
  rule cancel_established {
    select when wrangler cancel_relationships
    foreach event:attr("establishedIDs") setting(subID)
    always {
      raise wrangler event "subscription_cancellation" attributes event:attrs
                                                                  .put("Id", subID)
                                                                  .delete("establishedIDs") //No need to move giant arrays through event chain
                                                                  .delete("inboundIDs")
                                                                  .delete("outboundIDs")
    }
  }
  
  rule cancel_inbound {
    select when wrangler cancel_relationships
    foreach event:attr("inboundIDs") setting(subID)
    always {
      raise wrangler event "inbound_rejection" attributes event:attrs
                                                                  .put("Id", subID)
                                                                  .delete("establishedIDs")
                                                                  .delete("inboundIDs")
                                                                  .delete("outboundIDs")
    }
  }
  
  rule cancel_outbound {
    select when wrangler cancel_relationships
    foreach event:attr("outboundIDs") setting(subID)
    always {
      raise wrangler event "outbound_cancellation" attributes event:attrs
                                                                  .put("Id", subID)
                                                                  .delete("establishedIDs")
                                                                  .delete("inboundIDs")
                                                                  .delete("outboundIDs");
    }
  }
  
/* NOT USED IN V1.0 */
/*
  rule done_cleaning_up {
    select when wrangler subscription_removed
             or wrangler outbound_subscription_cancelled
             or wrangler inbound_subscription_cancelled
             or wrangler cancel_relationships
    if wrangler:isMarkedForDeath() && not hasRelationships() then
    noop()
    fired {
      raise wrangler event "cleanup_finished" attributes {
        "domain":meta:rid
      }
    }
  }
*/

  //START OF A SUBSCRIPTION'S CREATION
  //For the following comments, consider picoA sending the request to picoB

  rule createRxBus {
    select when wrangler subscription
             or wrangler relationship
    pre {
      layer2 = event:attr("layer2") == true
      channel_name  = event:attr("name").defaultsTo(random:word())
      channel_type  = event:attr("channel_type").defaultsTo("Tx_Rx","Tx_Rx channel_type used.")
      pending_entry = pending_entry().put(["wellKnown_Tx"],event:attr("wellKnown_Tx"))
    }
    if not layer2 && pending_entry{"wellKnown_Tx"} && pending_entry{"wellKnown_Tx"} != wellKnown_Rx(){"id"} then // check if we have someone to send a request to
      ctx:newChannel([channel_name,channel_type],allow_all_eventPolicy,allow_all_queryPolicy) setting(channel); // create Rx
    fired {
      newBus        = pending_entry.put({ "Rx" : channel{"id"} });
      fullNewBus    = newBus.put(
                                  {  "name": channel_name,
                                     "channel_name": channel_name,
                                     "channel_type": channel_type,
                                   }
                                 );
      ent:outbound := outbound().append( fullNewBus );
      raise wrangler event "subscription_request_needed"
        attributes event:attrs.put(fullNewBus);
      raise wrangler event "outbound_pending_subscription_added" attributes event:attrs.put(fullNewBus)// API event
      raise wrangler event "outbound_pending_relationship_added" attributes event:attrs.put(fullNewBus)// API event
    }
  }//end createMySubscription rule

  rule createRxBusLegacySelfFailure {
    select when wrangler subscription
             or wrangler relationship
             where not event:attr("layer2") == true
               && event:attr("wellKnown_Tx") == wellKnown_Rx(){"id"}
    fired {
      raise wrangler event "self_relationship_failure" attributes event:attrs
    }
  }

  rule createRxBusLegacyFailure {
    select when wrangler subscription
             or wrangler relationship
    pre {
      layer2 = event:attr("layer2") == true
      hasWellKnown = event:attr("wellKnown_Tx")
    }
    if not layer2 && not hasWellKnown then noop()
    fired {
      raise wrangler event "wellKnown_Tx_format_failure" attributes event:attrs
    }
  }

  rule createRxBusLayer2 {
    select when wrangler subscription
             or wrangler relationship
    pre {
      layer2 = event:attr("layer2") == true
      target_did = event:attr("target_did")
      channel_name = event:attr("name").defaultsTo(random:word())
      channel_type = event:attr("channel_type").defaultsTo("Tx_Rx","Tx_Rx channel_type used.")
      pending_entry = pending_entry()
        .put(["target_did"], target_did)
        .put(["layer2"], true)
    }
    if layer2 && target_did && target_did != wrangler:myDid() then
      ctx:newChannel([channel_name,channel_type],allow_all_eventPolicy,allow_all_queryPolicy) setting(channel)
    fired {
      newBus = pending_entry.put({ "Rx" : channel{"id"} })
      fullNewBus = newBus.put({
        "name": channel_name,
        "channel_name": channel_name,
        "channel_type": channel_type,
      })
      ent:outbound := outbound().append(fullNewBus)
      raise wrangler event "subscription_request_needed" attributes event:attrs.put(fullNewBus)
      raise wrangler event "outbound_pending_subscription_added" attributes event:attrs.put(fullNewBus)
      raise wrangler event "outbound_pending_relationship_added" attributes event:attrs.put(fullNewBus)
    }
  }

  rule createRxBusLayer2SelfFailure {
    select when wrangler subscription
             or wrangler relationship
             where event:attr("layer2") == true
               && event:attr("target_did") == wrangler:myDid()
    fired {
      raise wrangler event "self_relationship_failure" attributes event:attrs
    }
  }

  rule createRxBusLayer2Failure {
    select when wrangler subscription
             or wrangler relationship
    pre {
      layer2 = event:attr("layer2") == true
      target_did = event:attr("target_did")
    }
    if layer2 && not target_did then noop()
    fired {
      raise wrangler event "target_did_format_failure" attributes event:attrs
    }
  }

  rule requestSubscription {
    select when wrangler subscription_request_needed
      pre {
        layer2 = event:attr("layer2") == true
        myHost = event:attr("Rx_host") == "localhost" => null                  |
                 event:attr("Rx_host")                => event:attr("Rx_host") |
                                                         meta:host
      }
      if not layer2 && event:attr("wellKnown_Tx") then
      event:send({
          "eci"   : event:attr("wellKnown_Tx"),
          "domain": "wrangler", "type": "new_subscription_request",
          "attrs" : event:attrs.put(//    _____perspectives_____
                                    //    other pico | this pico
                                     {"Rx_role"      : event:attr("Tx_role"),
                                      "Tx_role"      : event:attr("Rx_role"),
                                      "Tx"           : event:attr("Rx"),
                                      "Tx_host"      : myHost,
                                      })
          }, event:attr("Tx_host")); //send event to this host if provided
  }

  rule sendLayer2Intro {
    select when wrangler subscription_request_needed
    pre {
      layer2 = event:attr("layer2") == true
      target = event:attr("target_did")
      sent = layer2 && target && target != wrangler:myDid() => dido:sendSkyIntro({
        "subscriptionId": event:attr("Id"),
        "targetDid": target,
        "name": event:attr("name").defaultsTo(event:attr("channel_name")),
        "Tx_role": event:attr("Tx_role"),
        "Rx_role": event:attr("Rx_role"),
        "channel_type": event:attr("channel_type"),
        "Tx_host": meta:host
      }) | null
    }
  }

  rule addInboundPendingFromSkyIntro {
    select when wrangler sky_intro
    pre {
      sub_name = event:attr("name").defaultsTo(event:attr("channel_name"))
      pending_entry = pending_entry()
        .put(["Tx_did"], event:attr("peer_did_long"))
        .put(["layer2"], true)
        .put(["Rx"], event:attr("Rx"))
        .put(["name"], sub_name)
        .put(["channel_name"], sub_name)
    }
    if pending_entry{"Rx"} && pending_entry{"Tx_did"} then noop()
    fired {
      ent:inbound := inbound().append(pending_entry)
      raise wrangler event "inbound_pending_subscription_added" attributes event:attrs
      raise wrangler event "inbound_pending_relationship_added" attributes event:attrs
    }
    else {
      raise wrangler event "no_Tx_did_failure" attributes event:attrs
    }
  }

  rule addInboundPendingSubscription {
    select when wrangler new_subscription_request
    pre {
      pending_entry = pending_entry().put(["Tx"],event:attr("Tx"))
    }
    if( pending_entry{"Tx"} ) then
      ctx:newChannel([event:attr("channel_name"),event:attr("channel_type")],allow_all_eventPolicy,allow_all_queryPolicy) setting(channel); // create Rx
    fired {
      Rx = channel{"id"};
      newBus       = pending_entry.put({"Rx" : Rx,
                                        "name": event:attr("channel_name"),
                                        "channel_name": event:attr("channel_name"),
                                       });
      ent:inbound := inbound().append( newBus );
      raise wrangler event "inbound_pending_subscription_added" attributes event:attrs.put(["Rx"], Rx); // API event
      raise wrangler event "inbound_pending_relationship_added" attributes event:attrs.put(["Rx"], Rx); // API event
    }
    else {
      raise wrangler event "no_Tx_failure" attributes  event:attrs // API event
    }
  }

  rule approveInboundPendingSubscriptionLayer2 {
    select when wrangler pending_subscription_approval
             or wrangler pending_relationship_approval
    pre {
      bus = findBus(inbound())
      response = bus{"layer2"} == true => dido:sendSkyIntroResponse(bus{"Id"}, bus{"Tx_did"}, {"status": "accepted"}) | null
    }
    if bus{"layer2"} == true then noop()
    fired {
      raise wrangler event "inbound_pending_subscription_approved" attributes event:attrs.put("Id", bus{"Id"}).put(["bus"],bus)
      raise wrangler event "inbound_pending_relationship_approved" attributes event:attrs.put("Id", bus{"Id"}).put(["bus"],bus)
    }
  }

  rule approveInboundPendingSubscription {
    select when wrangler pending_subscription_approval
             or wrangler pending_relationship_approval
    pre {
      bus     = findBus(inbound())
    }
    if not bus{"layer2"} == true && bus then
      event:send({
          "eci": bus{"Tx"},
          "domain": "wrangler", "type": "outbound_pending_subscription_approved",
          "attrs": event:attrs.put({
                    "Id"            : bus{"Id"} ,
                    "Tx"           : bus{"Rx"} ,
                    })
          }, bus{"Tx_host"})
    fired {
      raise wrangler event "inbound_pending_subscription_approved" attributes event:attrs.put("Id", bus{"Id"}).put(["bus"],bus)
      raise wrangler event "inbound_pending_relationship_approved" attributes event:attrs.put("Id", bus{"Id"}).put(["bus"],bus)
    }
  }

  rule addOutboundSubscriptionLayer2 {
    select when wrangler sky_intro_response
    pre {
      buses = outbound()
      bus = findBus(buses)
      index = indexOfId(buses, bus{"Id"})
    }
    if event:attr("status") == "accepted" && bus{"layer2"} == true && index >= 0 then noop()
    fired {
      updated = bus.put({
        "Tx_did": event:attr("peer_did_long"),
        "Tx_host": event:attr("Tx_host")
      }).delete(["target_did"]).delete(["wellKnown_Tx"])
      ent:established := established().append(updated)
      ent:outbound := buses.splice(index, 1)
      raise wrangler event "subscription_added" attributes event:attrs.put(["bus"], updated)
      raise wrangler event "relationship_added" attributes event:attrs.put(["bus"], updated)
    }
  }

  rule addOutboundSubscription {
    select when wrangler outbound_pending_subscription_approved
             or wrangler outbound_pending_relationship_approved
    pre{
      outbound = outbound()
      bus      = findBus(outbound).put({"Tx"           : event:attr("Tx"),
                                       })
                                  .delete(["wellKnown_Tx"])
      index    = indexOfId(outbound, bus{"Id"})
    }
    // If we haven't already moved the bus out of outbound
    if index >= 0 then
    noop()
    fired {
      ent:established := established().append(bus);
      ent:outbound    := outbound.splice(index,1);
      raise wrangler event "subscription_added" attributes event:attrs.put(["bus"], bus) // API event
      raise wrangler event "relationship_added" attributes event:attrs.put(["bus"], bus) // API event
    }
  }

  rule addInboundSubscription {
    select when wrangler inbound_pending_subscription_approved
             or wrangler inbound_pending_relationship_approved
    pre{
      inbound = inbound()
      index   = indexOfId(inbound,event:attr("Id"))
    }
    // If we havent already moved the bus out of inbound
    if index >= 0 then
    noop()
    fired {
      ent:established := established().append( event:attr("bus") );
      ent:inbound     := inbound.splice(index,1);
      raise wrangler event "subscription_added" attributes event:attrs // API event
      raise wrangler event "relationship_added" attributes event:attrs // API event
    }
  }

  // Layer 2 (1.6+): provision did:peer + internal Rx identity when bus.layer2 is set.
  rule establish_layer2_subscription_identity {
    select when wrangler subscription_added
             or wrangler relationship_added
    pre {
      bus = event:attr("bus").defaultsTo({})
      layer2_identity = bus{"layer2"} == true => dido:establishSubscription(bus) | null
    }
    if bus{"layer2"} == true && layer2_identity then noop()
    fired {
      enriched = bus
        .put("Rx_did", layer2_identity{"peerDid"})
        .put("Rx", layer2_identity{"rxEci"})
      buses = established()
      index = indexOfId(buses, bus{"Id"})
      ent:established := index >= 0 => buses.splice(index, 1).append(enriched) | buses
    }
  }

  rule cancelEstablishedLayer2 {
    select when wrangler subscription_cancellation
             or wrangler relationship_cancellation
    pre {
      bus = findBus(established())
      sent = bus{"layer2"} == true => dido:crossPicoEvent(bus{"Id"}, {
        "domain": "wrangler",
        "name": "established_removal",
        "attrs": event:attrs.put("Id", bus{"Id"})
      }) | null
    }
    if bus{"layer2"} == true then noop()
    fired {
      raise wrangler event "established_removal" attributes event:attrs.put("Id", bus{"Id"})
    }
  }

  rule cancelEstablished {
    select when wrangler subscription_cancellation
             or wrangler relationship_cancellation
    pre{
      bus     = findBus(established())
      Tx_host = bus{"Tx_host"}
    }
    if not bus{"layer2"} == true && bus then
      event:send({
          "eci"   : bus{"Tx"},
          "domain": "wrangler", "type": "established_removal",
          "attrs" : event:attrs.put({
                      "Rx": bus{"Tx"},
                      "Tx": bus{"Rx"},
                      "Id": bus{"Id"}
                    })
          }, Tx_host)
    fired {
      raise wrangler event "established_removal" attributes event:attrs.put("Id",bus{"Id"})
    }
  }

  rule removeEstablished {
    select when wrangler established_removal
    pre{
      buses = established()
      bus   = findBus(buses)
      index = indexOfId(buses, bus{"Id"})
      teardown = bus{"layer2"} == true => dido:teardownSubscription(bus{"Id"}) | null
    }
    if index >= 0 then
      wrangler:deleteChannel(bus{"Rx"})
    fired {
      ent:established := buses.splice(index,1);
      raise wrangler event "subscription_removed" attributes event:attrs.put({ "bus" : bus }) // API event
      raise wrangler event "relationship_removed" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }

  rule cancelInboundLayer2 {
    select when wrangler inbound_rejection
             or wrangler inbound_relationship_rejection
    pre {
      bus = findBus(inbound())
      sent = bus{"layer2"} == true => dido:crossPicoEvent(bus{"Id"}, {
        "domain": "wrangler",
        "name": "outbound_removal",
        "attrs": event:attrs.put("Id", bus{"Id"})
      }) | null
    }
    if bus{"layer2"} == true then noop()
    always {
      raise wrangler event "inbound_removal" attributes event:attrs.put("Id", bus{"Id"})
    }
  }

  rule cancelInbound {
    select when wrangler inbound_rejection
             or wrangler inbound_relationship_rejection
    pre{
      bus     = findBus(inbound())
      Tx_host = bus{"Tx_host"}
    }
    if not bus{"layer2"} == true && bus then
      event:send({
          "eci"   : bus{"Tx"},
          "domain": "wrangler", "type": "outbound_removal",
          "attrs" : event:attrs.put({
                      "Id": bus{"Id"}
                    })
          }, Tx_host)
    always {
      raise wrangler event "inbound_removal" attributes event:attrs.put("Id",bus{"Id"})
    }
  }

  rule removeInbound {
    select when wrangler inbound_removal
    pre{
      buses = inbound()
      bus   = findBus(buses)
      index = indexOfId(buses, bus{"Id"})
      teardown = bus{"layer2"} == true => dido:teardownSubscription(bus{"Id"}) | null
    }
    if index >= 0 then
      wrangler:deleteChannel(bus{"Rx"})
    fired {
      ent:inbound := buses.splice(index,1);
      raise wrangler event "inbound_subscription_cancelled" attributes event:attrs.put({ "bus" : bus }) // API event
      raise wrangler event "inbound_relationship_cancelled" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }

  rule cancelOutboundLayer2 {
    select when wrangler outbound_cancellation
             or wrangler outbound_relationship_cancellation
    pre {
      bus = findBus(outbound())
      sent = bus{"layer2"} == true => dido:crossPicoEvent(bus{"Id"}, {
        "domain": "wrangler",
        "name": "inbound_removal",
        "attrs": event:attrs.put("Id", bus{"Id"}).put("Tx", bus{"Rx"})
      }) | null
    }
    if bus{"layer2"} == true then noop()
    always {
      raise wrangler event "outbound_removal" attributes event:attrs.put("Id", bus{"Id"})
    }
  }

  rule cancelOutbound {
    select when wrangler outbound_cancellation
             or wrangler outbound_relationship_cancellation
    pre{
      bus     = findBus(outbound())
      Tx_host = bus{"Tx_host"}
    }
    if not bus{"layer2"} == true && bus then
      event:send({
          "eci"   : bus{"wellKnown_Tx"},
          "domain": "wrangler", "type": "inbound_removal",
          "attrs" : event:attrs.put({
                      "Id": bus{"Id"},
                      "Tx": bus{"Rx"}
                    })
          }, Tx_host)
    always {
      raise wrangler event "outbound_removal" attributes event:attrs.put("Id",bus{"Id"})
    }
  }

  rule removeOutbound {
    select when wrangler outbound_removal
    pre{
      buses = outbound()
      bus   = findBus(buses)
      index = indexOfId(buses,bus{"Id"})
      teardown = bus{"layer2"} == true => dido:teardownSubscription(bus{"Id"}) | null
    }
    if index >= 0 then
      wrangler:deleteChannel(bus{"Rx"})
    fired {
      ent:outbound := buses.splice(index,1);
      raise wrangler event "outbound_subscription_cancelled" attributes event:attrs.put({ "bus" : bus }) // API event
      raise wrangler event "outbound_relationship_cancelled" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }
  
  rule sendEventToSubCheck {
    select when wrangler send_event_on_subs
             or wrangler send_event_on_relationships
    pre {
      subID = event:attr("subID")
      Tx_role = event:attr("Tx_role")
      Rx_role = event:attr("Rx_role")
      establishedWithID = subID => established("Id", subID) | []
      establishedWithTx_role = Tx_role => established("Tx_role", Tx_role) | []
      establishedWithRx_role = Rx_role => established("Rx_role", Rx_role) | []
      subs = establishedWithID.append(establishedWithTx_role).append(establishedWithRx_role)
    }
    if subs.length() > 0 && event:attr("domain") && event:attr("type") then
    noop()
    fired {
      raise wrangler event "send_event_to_subs" attributes event:attrs.put("subs", subs)
    } else {
      raise wrangler event "failed_to_send_event_to_sub" attributes event:attrs.put({
        "foundSubsToSendTo":subs.length() > 0,
        "domainGiven":event:attr("domain").as("Boolean"),
        "typeGiven":event:attr("type").as("Boolean"),
      })
      raise wrangler event "failed_to_send_event_to_relationship" attributes event:attrs.put({
        "foundSubsToSendTo":subs.length() > 0,
        "domainGiven":event:attr("domain").as("Boolean"),
        "typeGiven":event:attr("type").as("Boolean"),
      })
    }
  }
  
  rule send_event_to_subs {
    select when wrangler send_event_to_subs
    foreach event:attr("subs") setting (sub)
    pre {
      layer2 = sub{"layer2"} == true
      sent = layer2 => dido:crossPicoEvent(sub{"Id"}, {
        "domain": event:attr("domain"),
        "name": event:attr("type"),
        "attrs": event:attr("attrs").defaultsTo({})
      }) | null
      tx = sub{"Tx"}
      host = sub{"Tx_host"}
    }
    if not layer2 && tx then
      event:send({"eci":tx, "domain":event:attr("domain"), "type":event:attr("type"), "attrs":event:attr("attrs").defaultsTo({})}, host)
  }

  rule autoAccept {
    select when wrangler inbound_pending_subscription_added
             or wrangler inbound_pending_relationship_added
    pre{
      /*
      autoAcceptConfig{
        configName : {
          configName: "name"
          password: "<hashedPassword>"
          entries: {
            <entries>
          }
        }
        . . .
   * entry:
   * 
   * entryVar: [regEx, regEx, ...]
      }*/                                                                         
      matches = autoAcceptConfig().map(function(config, configName) { // For eaech config
                                      doesConfigMatch(config)
                                    }).klog("final map").values().any(function(bool){bool}) // If any did match then we can approve the subscription
    }
    if matches then noop()
    fired {
      raise wrangler event "pending_subscription_approval" attributes event:attrs;
      raise wrangler event "pending_relationship_approval" attributes event:attrs;
      raise wrangler event "auto_accepted_subscription_request" attributes event:attrs;  //API event
      raise wrangler event "auto_accepted_relationship_request" attributes event:attrs;  //API event
    }// else ...
  }

  /**
   * 
   * event:attr("config"):
   * {
      configName: "name"
      password: <password> (not in production)
      entries: {
        <entries>
      }
     }
   * entry:
   * 
   * entryVar: [regEx, regEx, ...]
   * 
   */
  rule autoAcceptConfigUpdate {
    select when wrangler autoAcceptConfigUpdate
    pre { 
      givenConfig = event:attr("config").defaultsTo({
        "configName": event:attr("configName"),
        "password": event:attr("password"),
        "entries": event:attr("regexMap").decode()
      });
      givenName = givenConfig["configName"]
      configPassword = givenConfig["password"].defaultsTo("")
      
      //hashedPassword = math:hash("sha256", configPassword) // Not meant to be robust, just so you can't easily query it
      config = autoAcceptConfig()
      existingConfig = config[givenName].defaultsTo({})
      //passwordMatch = configMatchesPassword(config, givenName, hashedPassword)
      
      configToAdd = event:attr("delete") => null | givenConfig//.put("password", hashedPassword);
      
      }
    if (givenName.klog("configName")) then noop()// && configPassword.klog("configPassword") && passwordMatch.klog("passwordMatch")) then noop()
    fired {
      ent:autoAcceptConfig := autoAcceptConfig()
      ent:autoAcceptConfig{[givenName]} := configToAdd.klog("added config");
      ent:autoAcceptConfig := ent:autoAcceptConfig.delete(givenName) if event:attr("delete");
      raise wrangler event "auto_accept_config_updated" attributes event:attrs
        // config.put( [event:attr("variable")] ,
        // config{event:attr("variable")}.defaultsTo([]).append([event:attr("regex_str")])); // possible to add the same regex_str multiple times.
    }
    else {
      raise wrangler event "autoAcceptConfigUpdate_failure" attributes event:attrs // API event
    }
  }

  rule prepare_to_delete {
    select when wrangler intent_to_delete
      Id re#^(.+)$# setting(Id)
    pre {
      the_subs = established("Id",Id)
    }
    if the_subs then noop()
    fired {
      raise wrangler event "subscription_cancellation"
        attributes event:attrs
      raise wrangler event "ready_for_deletion"
    }
  }
}
