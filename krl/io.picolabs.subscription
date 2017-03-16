ruleset Subscriptions {
  meta {
    name "subscriptions"
    description <<
      subscription ruleset for CS462 lab.
    >>
    author "CS462 TA"
    use module io.picolabs.pico alias wrangler
    provides getSubscriptions, createChannel , klogtesting
    shares getSubscriptions, createChannel ,klogtesting
    logging on
  }

 global{
    getSelf = function(){
       wrangler:myself() // must be wrapped in a function
    }
    createChannel = function(options){
      logs = options.klog("parameters ");
      self = getSelf().klog("self");
      id = self.id;
      channel = engine:newChannel(
        { "name": options.name, "type": options.eci_type, "pico_id": id }).klog("newchannel");
      eci = channel.id;
      {"eci": eci, "name": options.name,"type": options.eci_type, "attributes": options.attributes }
    }
    
    getSubscriptions = function(){
      ent:subscriptions.defaultsTo({})
    }

    standardOut = function(message) {
      msg = ">> " + message + " results: >>";
      msg
    }
    standardError = function(message) {
      error = ">> error: " + message + " >>";
      error
    } 

    // this only creates 5 random names, if none are unique the function will fail.... but thats unlikely. 

    randomSubscriptionName = function(name_space){
        subscriptions = getSubscriptions();
        n = 5;
        //array = (0).range(n).map(function(n){
        array = [1,2,3,4,5].map(function(n){
          (word.randomWord())
          }).klog("randomWords");
        names= array.collect(function(name){
          (subscriptions{name_space + ":" + name}) => "unique" | "taken"
        });
        name = names{"unique"} || [];

        unique_name =  name.head().defaultsTo("",standardError("unique name failed")).klog("uniqueName")
        (unique_name)
    }
    checkSubscriptionName = function(name , name_space){
      (subscriptions{name_space + ":" + name}) => false | true 
    }
  }
  rule subscribeNameCheck {
    select when wrangler subscription
    pre {
      name_space = event:attr("name_space")
      name   = event:attr("name") || randomSubscriptionName(name_space).klog("testing should not get here") //.defaultsTo(randomSubscriptionName(name_space), standardError("channel_name"))
      attr = event:attrs()
      attrs = attr.put({"name":name}).klog("attrs")
    }
    if(checkSubscriptionName(name,name_space)) then
    //{
      noop()
    //}
    fired{
      raise wrangler event "checked_name_subscription"
       attributes attrs
    }
    else{
      //error warn "douplicate subscription name, failed to send request "+name;
      //log(">> could not send request #{name} >>");
      logs.klog(">> could not send request #{name} >>")
    }
  }

  rule subscribe {
    select when wrangler checked_name_subscription
   pre {
      // attributes for inbound attrs 
      logs = event:attrs().klog("attrs")
      name   = event:attr("name").defaultsTo("standard",standardError("channel_name"))
      name_space     = event:attr("name_space").defaultsTo("shared", standardError("name_space"))
      my_role  = event:attr("my_role").defaultsTo("peer", standardError("my_role"))
      subscriber_role  = event:attr("subscriber_role").defaultsTo("peer", standardError("subscriber_role"))
      subscriber_eci = event:attr("subscriber_eci").defaultsTo("no_subscriber_eci", standardError("subscriber_eci"))
      channel_type      = event:attr("channel_type").defaultsTo("subs", standardError("type"))
      attributes = event:attr("attrs").defaultsTo("status", standardError("attributes "))

      // create unique_name for channel
      unique_name = name_space + ":" + name
      logs = unique_name.klog("name")
      // build pending subscription entry
      pending_entry = {
        "subscription_name"  : name,
        "name_space"    : name_space,
        "relationship" : my_role +"<->"+ subscriber_role, 
        "my_role" : my_role,
        "subscriber_role" : subscriber_role,
        "subscriber_eci"  : subscriber_eci, // this will remain after accepted
        "status" : "outbound", // should this be passed in from out side? I dont think so.
        "attributes" : attributes
      }.klog("pending entry") 
      //create call back for subscriber     
      options = {
          "name" : unique_name, 
          "eci_type" : channel_type,
          "attributes" : pending_entry
          //"policy" : ,
      }.klog("options")
    newSubscription = (subscriber_eci != "no_subscriber_eci").klog("True?") => createChannel(options) | {}
    updatedSubs = getSubscriptions().put([newSubscription.name] , newSubscription)
    }
    if(subscriber_eci != "no_subscriber_eci") // check if we have someone to send a request too
    then
    //{      
      event:send({
          "eci": subscriber_eci, "eid": "subscriptionsRequest",
          "domain": "wrangler", "type": "pending_subscription",
          "attrs": {"name"  : name,
             "name_space"    : name_space,
             "relationship" : subscriber_role +"<->"+ my_role ,
             "my_role" : subscriber_role,
             "subscriber_role" : my_role,
             "outbound_eci"  :  newSubscription.eci, 
             "status" : "inbound",
             "channel_type" : channel_type,
             "channel_name" : unique_name,
             "attributes" : attributes } 
      })
    //}
    fired {
      logs.klog(standardOut("success"));
      logs.klog(">> successful >>");
      ent:subscriptions := updatedSubs;
      raise wrangler event pending_subscription
        with status = pending_entry{"status"}
        channel_name = unique_name
        subscription_name = pending_entry{"subscription_name"}
        name_space = pending_entry{"name_space"}
        relationship = pending_entry{"relationship"}  
        my_role = pending_entry{"my_role"}
        subscriber_role = pending_entry{"subscriber_role"}
        subscriber_eci  = pending_entry{"subscriber_eci"}
        attributes = pending_entry{"attributes"}  
    } 
    else {
      logs.klog(">> failure >>")
    }
  }

 rule addPendingSubscription { // depends on wether or not a channel_name is being passed as an attribute
    select when wrangler pending_subscription
   pre {
        channel_name = event:attr("channel_name")//.defaultsTo("SUBSCRIPTION", standardError("channel_name")) 
        channel_type = event:attr("channel_type")//.defaultsTo("SUBSCRIPTION", standardError("type")) 
        status = event:attr("status").defaultsTo("", standardError("status"))
      pending_subscriptions = (status == "inbound") =>
         {
            "subscription_name"  : event:attr("name").defaultsTo("", standardError("")),
            "name_space"    : event:attr("name_space").defaultsTo("", standardError("name_space")),
            "relationship" : event:attr("relationship").defaultsTo("", standardError("relationship")),
            "my_role" : event:attr("my_role").defaultsTo("", standardError("my_role")),
            "subscriber_role" : event:attr("subscriber_role").defaultsTo("", standardError("subscriber_role")),
            "outbound_eci"  : event:attr("outbound_eci").defaultsTo("", standardError("outbound_eci")),
            "status"  : event:attr("status").defaultsTo("", standardError("status")),
            "attributes" : event:attr("attributes").defaultsTo("", standardError("attributes"))
          } |
          {}
      unique_name = channel_name
      options = {
        "name" : unique_name, 
        "eci_type" : channel_type,
        "attributes" : pending_subscriptions
          //"policy" : ,
      }
      newSubscription = (status == "inbound") => ( 
                        (checkSubscriptionName(unique_name)) => createChannel(options) | {} ) | {}
    }
    if(status == "inbound") 
    then
    //{
    //  (checkSubscriptionName(unique_name)) => noop() | event:send({
    //      "eci": pending_subscriptions{"outbound_eci"}, "eid": "pending_subscription",
    //      "domain": "wrangler", "type": "outbound_subscription_cancellation",
    //      "attrs": {"subscription_name"  : pending_subscriptions{"subscription_name"}})
      noop()
      
    //}
    fired { 
      //(checkSubscriptionName(unique_name)) => noop() | 
      //raise wrangler event "inbound_subscription_rejection" 
      //    with subscription_name = pending_subscriptions{"subscription_name"} 
      logs.klog(standardOut("successful pending incoming"));
      ent:subscriptions := getSubscriptions().put( [newSubscription.name] , newSubscription );
      raise wrangler event "inbound_pending_subscription_added" // event to nothing
          with status = pending_subscriptions{"status"} // could this be replaced with all of the attrs pasted in?
             name = pending_subscriptions{"subscription_name"}
             channel_name = unique_name
             name_space = pending_subscriptions{"name_space"}
             relationship = pending_subscriptions{"relationship"}
             subscriber_role = pending_subscriptions{"subscriber_role"}
             my_role = pending_subscriptions{"my_role"}
             attributes = pending_subscriptions{"attributes"}
             outbound_eci = pending_subscriptions{"outbound_eci"}
             channel_type = channel_type
      //log(standardOut("failure >>")) if (channel_name == "")
    } 
    else { 
      //log (standardOut("success pending outgoing >>"))
      logs.klog(standardOut("success pending outgoing >>"));
      raise wrangler event "outbound_pending_subscription_added" // event to nothing
        attributes event:attrs()
    }
  }

rule approvePendingSubscription { 
    select when wrangler pending_subscription_approval
    pre{
      logs = event:attrs().klog("attrs")
      subscription_name = event:attr("subscription_name").klog("sub name")
      subs = getSubscriptions().klog("subscriptions")
      inbound_eci = subs{[subscription_name,"eci"]}.klog("subscription inbound") //{[subscription_name,"eci"]}
      outbound_eci = subs{[subscription_name,"attributes","outbound_eci"]}.klog("subscriptions outbound")
    }
    if (outbound_eci) then
    //{
      event:send({
          "eci": outbound_eci, "eid": "approvePendingSubscription",
          "domain": "wrangler", "type": "pending_subscription_approved",
          "attrs": {"outbound_eci" : inbound_eci , 
                      "status" : "outbound",
                      "subscription_name" : subscription_name }
          })
    //}
    fired 
    {
      logs.klog(standardOut("success >>"));
      //log (standardOut("success"));
      raise wrangler event "pending_subscription_approved"   
        with channel_name = channel_name
             status = "inbound"
             subscription_name = subscription_name
    } 
    else 
    {
      logs.klog(standardOut(">> failure >>"))
      //log(">> failure >>");
    }
  }




  rule addSubscription { // changes attribute status value to subscribed
    select when wrangler pending_subscription_approved
    pre{
      status = event:attr("status") //.defaultsTo("", standardError("status"))
      subscription_name = event:attr("subscription_name")
      subs = getSubscriptions()
      subscription = subs{subscription_name}.klog("subscription addSubscription")
      attributes = subscription{["attributes"]}.klog("attributes subscriptions")
      attr = attributes.put({"status":"subscribed"}) // over write original status

      outGoing = function(){
        attrs = attr.put({"outbound_eci": event:attr("outbound_eci")}).klog("put outgoing outbound_eci: "); // add outbound_eci
        attrs
      }

      atttrs = (status == "outbound" ) => 
            outGoing() | 
            attr
      updatedSubscription = subscription.put({"attributes":atttrs}).klog("updated subscriptions")
    }
    if (true) then 
    //{
     noop()
    //}
    fired {
      logs.klog(standardOut(">> success >>"));
      ent:subscriptions := getSubscriptions().put([updatedSubscription.name],updatedSubscription);
      raise wrangler event "subscription_added" // event to nothing
        with subscription_name = event:attr("subscription_name")
      } 
    else {
      logs.klog(standardOut(">> failure >>"))
    }
  }

  rule cancelSubscription {
    select when wrangler subscription_cancellation
            or  wrangler inbound_subscription_rejection
            or  wrangler outbound_subscription_cancellation
    pre{
      subscription_name = event:attr("subscription_name")//.defaultsTo( "No channel_name", standardError("channel_name"))
      subs = getSubscriptions()
      outbound_eci = subs{[subscription_name,"attributes","outbound_eci"]}.klog("outboundEci")
    }
    //if( eci != "No outbound_eci") then // always try to notify other party
    if(true) then
    //{
      event:send({
          "eci": outbound_eci, "eid": "cancelSubscription1",
          "domain": "wrangler", "type": "subscription_removal",
          "attrs": {
                    "subscription_name": subscription_name
                  }
          })
    //}
    fired {
      logs.klog(standardOut(">> success >>"));
      raise wrangler event "subscription_removal" 
        with subscription_name = subscription_name
          } 
    else {
      logs.klog(standardOut(">> failure >>"))
    }
  } 

  rule removeSubscription {
    select when wrangler subscription_removal
    pre{
      subscription_name = event:attr("subscription_name").klog("subsname")
      subs = getSubscriptions().klog("subscriptions")
      subscription = subs{subscription_name}
      updatedSubscription = subs.delete(subscription_name).klog("delete")
    }
    if(true) then
    //{
     noop()
    //}
    always {
      ent:subscriptions := updatedSubscription;
      logs.klog(standardOut("success, attemped to remove subscription"));
      raise wrangler event "subscription_removed" // event to nothing
        with removed_subscription = subscription
    } 
  } 

}
