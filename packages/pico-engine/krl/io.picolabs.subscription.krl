ruleset io.picolabs.subscription {
  meta {
    name "subscription "
    description <<
      Tx/Rx ruleset.
    >>
    author "Tedrub Modulus"
    use module io.picolabs.wrangler alias wrangler
    provides established, outbound, inbound, wellKnown_Rx, autoAcceptConfig, __testing
    shares   established, outbound, inbound, wellKnown_Rx, autoAcceptConfig, __testing
    logging on
  }

 global{
    __testing = { "queries": [  { "name": "wellKnown_Rx"} ,
                                { "name": "established" /*,"args":["key","value"]*/},
                                { "name": "outbound"} ,
                                { "name": "inbound"} ,
                                { "name": "autoAcceptConfig"} ],
                  "events": [ { "domain": "wrangler", "type": "subscription",
                                "attrs": [ "wellKnown_Tx","Rx_role","Tx_role","name","channel_type","Tx_host","password"] },
                              { "domain": "wrangler", "type": "subscription",
                                "attrs": [ "wellKnown_Tx","Rx_role","Tx_role","name","channel_type","password"] },
                              { "domain": "wrangler", "type": "subscription",
                                "attrs": [ "wellKnown_Tx","password"] },
                              { "domain": "wrangler", "type": "subscription",
                                "attrs": [ "wellKnown_Tx"] },
                              { "domain": "wrangler", "type": "pending_subscription_approval",
                                "attrs": [ "Id" ] },
                              { "domain": "wrangler", "type": "subscription_cancellation",
                                "attrs": [ "Id" ] },
                              { "domain": "wrangler", "type": "inbound_rejection",
                                "attrs": [ "Id" ] },
                              { "domain": "wrangler", "type": "outbound_cancellation",
                                "attrs": [ "Id" ] },
                              { "domain": "wrangler", "type": "autoAcceptConfigUpdate",
                                "attrs": [ "configName", "password", "regexMap","delete" ] } ]}
/*
ent:inbound [
  {
    "Tx":"", //The channel identifier this pico will send events to
    "Rx":"", //The channel identifier this pico will be listening and receiving events on
    "Tx_role":"", //The subscription role or purpose that the pico on the other side of the subscription serves
    "Rx_role":"", //The role this pico serves, or this picos purpose in relation to the subscription
    "Tx_host": "", //the host location of the other pico if that pico is running on a separate engine
    "Tx_verify_key": ,
    "Tx_public_key":
  },...,...
]

ent:outbound [
  {
    "Wellknown_Tx":"", //only in originating bus, the wellknown is the original channel on which picos are introduced to each other.
    "Tx":"", //The channel identifier this pico will send events to
    "Rx":"", //The channel identifier this pico will be listening and receiving events on
    "Tx_role":"", //The subscription role or purpose that the pico on the other side of the subscription serves
    "Rx_role":"", //The role this pico serves, or this picos purpose in relation to the subscription
    "Tx_host": "" //the host location of the other pico if that pico is running on a separate engine
  },...,...
]

ent:established [
  {
    "Tx":"", //The channel identifier this pico will send events to
    "Rx":"", //The channel identifier this pico will be listening and receiving events on
    "Tx_role":"", //The subscription role or purpose that the pico on the other side of the subscription serves
    "Rx_role":"", //The role this pico serves, or this picos purpose in relation to the subscription
    "Tx_host": "" //the host location of the other pico if that pico is running on a separate engine
    "Tx_verify_key": ,
    "Tx_public_key":
  },...,...
]
*/

    wellknown_Policy = { // we need to restrict what attributes are allowed on this channel, specifically Id.
      "name": "wellknown",
      "event": {
          "allow": [
              {"domain": "wrangler", "type": "subscription"},
              {"domain": "wrangler", "type": "new_subscription_request"},
              {"domain": "wrangler", "type": "inbound_removal"}
          ]
      }
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
      wrangler:channel("wellKnown_Rx")
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

    pending_entry = function(){
      roles  = event:attr("Rx_role") => { // add possible roles
                  "Rx_role"      : event:attr("Rx_role"),
                  "Tx_role"      : event:attr("Tx_role")
                } | {};
      _roles = event:attr("Tx_host") => // add possible host
                roles.put(["Tx_host"] , event:attr("Tx_host"))  | roles;
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

  rule create_wellKnown_Rx{
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    pre{ channel = wellKnown_Rx() }
    if(channel.isnull() || channel{"type"} != "Tx_Rx") then every{
      wrangler:newPolicy(wellknown_Policy) setting(__wellknown_Policy)
      wrangler:createChannel(meta:picoId, "wellKnown_Rx", "Tx_Rx", __wellknown_Policy{"id"})
    }
    fired{
      raise wrangler event "wellKnown_Rx_created" attributes event:attrs;
      ent:wellknown_Policy := __wellknown_Policy;
    }
    else{
      raise wrangler event "wellKnown_Rx_not_created" attributes event:attrs; //exists
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

  //START OF A SUBSCRIPTION'S CREATION
  //For the following comments, consider picoA sending the request to picoB

  rule createRxBus {
    select when wrangler subscription
    pre {
      channel_name  = event:attr("name").defaultsTo(random:word())
      channel_type  = event:attr("channel_type").defaultsTo("Tx_Rx","Tx_Rx channel_type used.")
      pending_entry = pending_entry().put(["wellKnown_Tx"],event:attr("wellKnown_Tx"))
    }
    if( pending_entry{"wellKnown_Tx"}) then // check if we have someone to send a request to
      wrangler:createChannel(meta:picoId, channel_name ,channel_type) setting(channel); // create Rx
    fired {
      newBus        = pending_entry.put({ "Rx" : channel{"id"} });
      fullNewBus    = newBus.put(
                                  {  "channel_name": channel_name,
                                     "channel_type": channel_type,
                                     "verify_key"  : channel{"sovrin"}{"verifyKey"},
                                     "public_key"  : channel{"sovrin"}{"encryptionPublicKey"}
                                   }
                                 );
      ent:outbound := outbound().append( newBus );
      raise wrangler event "subscription_request_needed"
        attributes event:attrs.put(fullNewBus);
      raise wrangler event "outbound_pending_subscription_added" attributes event:attrs.put(fullNewBus)// API event
    }
    else {
      raise wrangler event "wellKnown_Tx_format_failure" attributes  event:attrs // API event
    }
  }//end createMySubscription rule

  rule requestSubscription {
    select when wrangler subscription_request_needed
      pre {
        myHost = event:attr("Rx_host") == "localhost" => null                  |
                 event:attr("Rx_host")                => event:attr("Rx_host") |
                                                         meta:host
      }
      event:send({
          "eci"   : event:attr("wellKnown_Tx"),
          "domain": "wrangler", "type": "new_subscription_request",
          "attrs" : event:attrs.put(//    _____perspectives_____
                                    //    other pico | this pico
                                     {"Rx_role"      : event:attr("Tx_role"),
                                      "Tx_role"      : event:attr("Rx_role"),
                                      "Tx"           : event:attr("Rx"),
                                      "Tx_host"      : myHost,
                                      "Tx_verify_key": event:attr("verify_key"),
                                      "Tx_public_key": event:attr("public_key")})
          }, event:attr("Tx_host")); //send event to this host if provided
  }

  rule addInboundPendingSubscription {
    select when wrangler new_subscription_request
    pre {
      pending_entry = pending_entry().put(["Tx"],event:attr("Tx"))
    }
    if( pending_entry{"Tx"} ) then
      wrangler:createChannel(meta:picoId, event:attr("channel_name") ,event:attr("channel_type")) setting(channel); // create Rx
    fired {
      Rx = channel{"id"};
      newBus       = pending_entry.put({"Rx" : Rx,
                                        "Tx_verify_key" : event:attr("Tx_verify_key"),
                                        "Tx_public_key" : event:attr("Tx_public_key")
                                       });
      ent:inbound := inbound().append( newBus );
      raise wrangler event "inbound_pending_subscription_added" attributes event:attrs.put(["Rx"], Rx); // API event
    }
    else {
      raise wrangler event "no_Tx_failure" attributes  event:attrs // API event
    }
  }

  rule approveInboundPendingSubscription {
    select when wrangler pending_subscription_approval
    pre {
      bus     = findBus(inbound())
      channel = wrangler:channel(bus{"Rx"})
    }
      event:send({
          "eci": bus{"Tx"},
          "domain": "wrangler", "type": "outbound_pending_subscription_approved",
          "attrs": event:attrs.put({
                    "Id"            : bus{"Id"} ,
                    "Tx"           : bus{"Rx"} ,
                    "Tx_verify_key": channel{"sovrin"}{"verifyKey"},
                    "Tx_public_key": channel{"sovrin"}{"encryptionPublicKey"}
                    })
          }, bus{"Tx_host"})
    always {
      raise wrangler event "inbound_pending_subscription_approved" attributes event:attrs.put("Id", bus{"Id"}).put(["bus"],bus)
    }
  }

  rule addOutboundSubscription {
    select when wrangler outbound_pending_subscription_approved
    pre{
      outbound = outbound()
      bus      = findBus(outbound).put({"Tx"           : event:attr("Tx"),
                                        "Tx_verify_key": event:attr("Tx_verify_key"),
                                        "Tx_public_key": event:attr("Tx_public_key")
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
    }
  }

  rule addInboundSubscription {
    select when wrangler inbound_pending_subscription_approved
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
    }
  }

  rule cancelEstablished {
    select when wrangler subscription_cancellation
    pre{
      bus     = findBus(established())
      Tx_host = bus{"Tx_host"}
    }
    if bus then
      event:send({
          "eci"   : bus{"Tx"},
          "domain": "wrangler", "type": "established_removal",
          "attrs" : event:attrs.put({
                      "Rx": bus{"Tx"}, //change perspective
                      "Tx": bus{"Rx"}, //change perspective
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
    }
    if index >= 0 then
      engine:removeChannel(bus{"Rx"}) //wrangler:removeChannel ...
    fired {
      ent:established := buses.splice(index,1);
      raise wrangler event "subscription_removed" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }

  rule cancelInbound {
    select when wrangler inbound_rejection
    pre{
      bus     = findBus(inbound())
      Tx_host = bus{"Tx_host"}
    }
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
    }
    if index >= 0 then
      engine:removeChannel(bus{"Rx"})
    fired {
      ent:inbound := buses.splice(index,1);
      raise wrangler event "inbound_subscription_cancelled" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }

  rule cancelOutbound {
    select when wrangler outbound_cancellation
    pre{
      bus     = findBus(outbound())
      Tx_host = bus{"Tx_host"}
    }
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
    }
    if index >= 0 then
      engine:removeChannel(bus{"Rx"})
    fired {
      ent:outbound := buses.splice(index,1);
      raise wrangler event "outbound_subscription_cancelled" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }
  
  rule sendEventToSubCheck {
    select when wrangler send_event_on_subs
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
    }
  }
  
  rule send_event_to_subs {
    select when wrangler send_event_to_subs
    foreach event:attr("subs") setting (sub)
    pre {
      tx = sub{"Tx"}                                                                       // Get the "Tx" channel to send our query to
      host = sub{"Tx_host"}                                                                // See if the pico is on a different host. If it isn't use this engine's host
    }
    event:send({"eci":tx, "domain":event:attr("domain"), "type":event:attr("type"), "attrs":event:attr("attrs").defaultsTo({})}, host)
  }

  rule autoAccept {
    select when wrangler inbound_pending_subscription_added
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
      matches = ent:autoAcceptConfig.map(function(config, configName) { // For eaech config
                                      doesConfigMatch(config)
                                    }).klog("final map").values().any(function(bool){bool}) // If any did match then we can approve the subscription
    }
    if matches then noop()
    fired {
      raise wrangler event "pending_subscription_approval" attributes event:attrs;
      raise wrangler event "auto_accepted_subscription_request" attributes event:attrs;  //API event
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
}
