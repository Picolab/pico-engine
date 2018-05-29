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
                                "attrs": [ "variable", "regex_str" ] } ]}
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
    "Wellknown_Tx":""}} //only in originating bus, the wellknown is the original channel on which picos are introduced to each other.
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
              {"domain": "wrangler", "type": "pending_subscription"}
          ]
      }
    }
    autoAcceptConfig = function(){
      ent:autoAcceptConfig.defaultsTo({})
    }
    established = function(key,value){
      established = ent:established.defaultsTo([]);
      not key.isnull() && not value.isnull() => filterOn(established , key, value) | established
    }
    outbound = function(key,value){//Tx_Pending
      outbound = ent:outbound.defaultsTo([]);
      not key.isnull() && not value.isnull() => filterOn(outbound , key, value) | outbound
    }
    inbound = function(key,value){//Rx_Pending
      inbound = ent:inbound.defaultsTo([]);
      not key.isnull() && not value.isnull() => filterOn(inbound , key, value) | inbound
    }
    wellKnown_Rx = function(){
      wrangler:channel("wellKnown_Rx")
    }

    filterOn = function(array,key,value){
      array.filter(function(bus){ bus{key} == value})
    }
    indexOfRx = function(buses, _Id) {
      id = _Id.defaultsTo(event:attr("Id"));
      eqaulity = function(bus,id){ bus{"Id"} == id };

      findIndex = function(eqaul, value ,array, i){
        array.length() == 0 =>
                          -1 |
                          eqaul(array.head() , value) =>
                            i |
                            findIndex(eqaul, value, array.tail(), i+1 )
      };

      findIndex(eqaulity, eci, buses, 0)
    }
    findBus = function(buses){
      event:attr("Id") => buses.filter( function(bus){ bus{"Id"} == event:attr("Id") }).head() |
        event:attr("Rx") => buses.filter( function(bus){ bus{"Rx"} == event:attr("Rx") }).head() |
          event:attr("Tx") => buses.filter( function(bus){ bus{"Tx"} == event:attr("Tx") }).head() |
            buses.filter( function(bus){ bus{"Rx"} == meta:eci }).head() ;
    }
    randomName = function(){
      random:word()
    }
    pending_entry = function(){
      roles  = event:attr("Rx_role").isnull() => {} | { // add possible roles
                  "Rx_role"      : event:attr("Rx_role"),
                  "Tx_role"      : event:attr("Tx_role")
                };
      _roles = event:attr("Tx_host").isnull() => // add possible host
                roles  | roles.put(["Tx_host"] , event:attr("Tx_host"));
      event:attr("Id").isnull() => // add subscription identifier
                 _roles.put(["Id"], random:uuid()) | _roles.put(["Id"], event:attr("Id"))
    }

  }

  rule create_wellKnown_Rx{
    select when wrangler ruleset_added where rids >< meta:rid
    pre{ channel = wellKnown_Rx() }
    if(channel.isnull() || channel{"type"} != "Tx_Rx") then every{
      engine:newPolicy( wellknown_Policy ) setting(__wellknown_Policy)
      engine:newChannel(pico_id = meta:picoId, name = "wellKnown_Rx", type = "Tx_Rx", policy_id = __wellknown_Policy{"id"}) //should be wrangler:createChannel(...)
    }
    fired{
      raise Tx_Rx event "wellKnown_Rx_created" attributes event:attrs;
      ent:wellknown_Policy := __wellknown_Policy;
    }
    else{
      raise Tx_Rx event "wellKnown_Rx_not_created" attributes event:attrs; //exists
    }
  }

  //START OF A SUBSCRIPTION'S CREATION
  //For the following comments, consider picoA sending the request to picoB

  rule createRxBus {
    select when wrangler subscription
    pre {
      channel_name  = event:attr("name").defaultsTo(randomName())
      channel_type  = event:attr("channel_type").defaultsTo("Tx_Rx","Tx_Rx channel_type used.")
      pending_entry = pending_entry().put(["wellKnown_Tx"],event:attr("wellKnown_Tx"))
    }
    if( not pending_entry{"wellKnown_Tx"}.isnull() ) then // check if we have someone to send a request too
      engine:newChannel(meta:picoId, channel_name, channel_type) setting(channel); // create Rx
      //wrangler:createChannel(meta:picoId, event:attr("name") ,channel_type) setting(channel); // create Rx
    fired {
      newBus        = pending_entry.put({ "Rx" : channel{"id"} });
      ent:outbound := outbound().append( newBus );
      raise wrangler event "pending_subscription"
        attributes event:attrs.put(newBus.put(//
                                              {  "status"      : "outbound",
                                                 "channel_name": channel_name,
                                                 "channel_type": channel_type,
                                                 "verify_key"  : channel{"sovrin"}{"verifyKey"},
                                                 "public_key"  : channel{"sovrin"}{"encryptionPublicKey"}
                                                 }));
    }
    else {
      raise wrangler event "no_wellKnown_Tx_failure" attributes  event:attrs // API event
    }
  }//end createMySubscription rule

  rule sendSubscribersSubscribe {
    select when wrangler pending_subscription status re#outbound#
      event:send({
          "eci"   : event:attr("wellKnown_Tx"),
          "domain": "wrangler", "type": "pending_subscription",
          "attrs" : event:attrs.put(//    _____perspectives_____
                                    //    other pico | this pico
                                     {"status"       : "inbound",
                                      "Rx_role"      : event:attr("Tx_role"),
                                      "Tx_role"      : event:attr("Rx_role"),
                                      "Tx"           : event:attr("Rx"),
                                      "Tx_host"      : event:attr("Rx_host")=> event:attr("Rx_host") | meta:host , // send our host as Tx_host if Tx_host was provided.
                                      "Tx_verify_key": event:attr("verify_key"),
                                      "Tx_public_key": event:attr("public_key")})
          },                                           event:attr("Tx_host")); //send event to this host if provided
  }

 rule addOutboundPendingSubscription {
    select when wrangler pending_subscription status re#outbound#
    always {
      raise wrangler event "outbound_pending_subscription_added" attributes event:attrs// API event
    }
  }

  rule addInboundPendingSubscription {
    select when wrangler pending_subscription status re#inbound#
   pre {
      pending_entry = pending_entry().put(["Tx"],event:attr("Tx"))
    }
    if( not pending_entry{"Tx"}.isnull()) then
      engine:newChannel(meta:picoId,
                        event:attr("name") ,
                        event:attr("channel_type")
                        ) setting(channel) // create Rx
      //wrangler:createChannel(wrangler:myself(){"id"}, name ,channel_type) setting(channel); // create Rx
    fired {
      newBus       = pending_entry.put({"Rx" : channel{"id"},
                                        "Tx_verify_key" : event:attr("Tx_verify_key"),
                                        "Tx_public_key" : event:attr("Tx_public_key")
                                       });
      ent:inbound := inbound().append( newBus );
      raise wrangler event "inbound_pending_subscription_added" attributes event:attrs.put(["Rx"],channel{"id"}); // API event
    }
    else {
      raise wrangler event "no_Tx_failure" attributes  event:attrs // API event
    }
  }

  rule approveInboundPendingSubscription {
    select when wrangler pending_subscription_approval
    pre{ bus     = findBus(inbound())
         channel = wrangler:channel(bus{"Rx"})
        }
      event:send({
          "eci": bus{"Tx"},
          "domain": "wrangler", "type": "pending_subscription_approved",
          "attrs": {"Id"            : bus{"Id"} ,
                    "_Tx"           : bus{"Rx"} ,
                    "_Tx_verify_key": channel{"sovrin"}{"verifyKey"},
                    "_Tx_public_key": channel{"sovrin"}{"encryptionPublicKey"},
                    "status"        : "outbound" }
          }, bus{"Tx_host"})
    always {
      raise wrangler event "pending_subscription_approved" attributes event:attrs.put(["status"],"inbound").put(["bus"],bus)
    }
  }

  rule addOutboundSubscription {
    select when wrangler pending_subscription_approved status re#outbound#
    pre{
      outbound = outbound()
      bus      = findBus(outbound).put({"Tx"           : event:attr("_Tx"),
                                        "Tx_verify_key": event:attr("_Tx_verify_key"),
                                        "Tx_public_key": event:attr("_Tx_public_key")
                                       })// tightly coupled attr, smells like bad code..
                                  .delete(["wellKnown_Tx"])
      index    = indexOfRx(outbound, bus{"Id"})
    }
    always{
      ent:established := established().append(bus);
      ent:outbound    := outbound.splice(index,1);
      raise wrangler event "subscription_added" attributes event:attrs // API event
    }
  }

  rule addInboundSubscription {
    select when wrangler pending_subscription_approved status re#inbound#
    pre{
      inbound = inbound()
      index   = indexOfRx(inbound,event:attr("Id"))
    }
    always {
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
    event:send({
          "eci"   : bus{"Tx"},
          "Id"   : bus{"Id"},
          "domain": "wrangler", "type": "established_removal",
          "attrs" : event:attrs.put(["Rx"],bus{"Tx"}).put(["Tx"],bus{"Rx"}) // change perspective
          }, Tx_host)
    always {
      raise wrangler event "established_removal" attributes event:attrs.put("Id",bus{"Id"})
    }
  }

  rule removeEstablished {
    select when wrangler established_removal
    pre{
      buses = established()
      bus   = findBus(buses)
      index = indexOfRx(buses, bus{"Id"})
    }
      engine:removeChannel(bus{"Rx"}) //wrangler:removeChannel ...
    always {
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
          "Id"   : bus{"Id"},
          "domain": "wrangler", "type": "outbound_removal",
          "attrs" : event:attrs.put(["Rx"],bus{"Tx"})
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
      index = indexOfRx(buses, bus{"Id"})
    }
      engine:removeChannel(bus{"Rx"}) //wrangler:removeChannel ...
    always {
      ent:inbound := buses.splice(index,1);
      raise wrangler event "inbound_bus_removed" attributes event:attrs.put({ "bus" : bus }) // API event
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
          "Id"   : bus{"Id"},
          "domain": "wrangler", "type": "inbound_removal",
          "attrs" : event:attrs.put(["Tx"],bus{"Rx"})
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
      index = indexOfRx(buses,bus{"Id"})
    }
      engine:removeChannel(bus{"Rx"}) //wrangler:removeChannel ...
    always {
      ent:outbound := buses.splice(index,1);
      raise wrangler event "outbound_bus_removed" attributes event:attrs.put({ "bus" : bus }) // API event
    }
  }

  rule autoAccept {
    select when wrangler inbound_pending_subscription_added
    pre{
      /*autoAcceptConfig{
        var : [regex_str,..,..]
      }*/
      matches = ent:autoAcceptConfig.map(function(regs,k) {
                              var = event:attr(k);
                              matches = not var.isnull() => regs.map(function(regex_str){ var.match(regex_str)}).any( function(bool){ bool == true }) | false;
                              matches }).values().any( function(bool){ bool == true })
    }
    if matches then noop()
    fired {
      raise wrangler event "pending_subscription_approval" attributes event:attrs;
      raise wrangler event "auto_accepted_Tx_Rx_request" attributes event:attrs;  //API event
    }// else ...
  }

  rule autoAcceptConfigUpdate { // consider single time use password
    select when wrangler autoAcceptConfigUpdate
    pre{ config = autoAcceptConfig() }
    if (event:attr("variable") && event:attr("regex_str") ) then noop()
    fired {
      ent:autoAcceptConfig := config.put([event:attr("variable")],config{event:attr("variable")}.defaultsTo([]).append([event:attr("regex_str")])); // possible to add the same regex_str multiple times.
    }
    else {
      raise wrangler event "autoAcceptConfigUpdate_failure" attributes event:attrs // API event
    }
  }
}
