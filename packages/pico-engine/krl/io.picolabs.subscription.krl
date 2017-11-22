ruleset io.picolabs.subscription {
  meta {
    name "subscriptions"
    description <<
      subscription ruleset for CS462 lab.
    >>
    author "CS462 TA"
    use module io.picolabs.pico alias wrangler
    provides getSubscriptions, klogtesting, skyQuery
    shares getSubscriptions, klogtesting, skyQuery
    logging on
  }

 global{
    /*
      skyQuery is used to programmatically call function inside of other picos from inside a rule.
      parameters;
         eci - The eci of the pico which contains the function to be called
         mod - The ruleset ID or alias of the module  
         func - The name of the function in the module 
         params - The parameters to be passed to function being called
         optional parameters 
         _host - The host of the pico engine being queried. 
                 Note this must include protocol (http:// or https://) being used and port number if not 80.
                 For example "http://localhost:8080", which also is the default.
         _path - The sub path of the url which does not include mod or func.
                 For example "/sky/cloud/", which also is the default.
         _root_url - The entire url except eci, mod , func.
                 For example, dependent on _host and _path is 
                 "http://localhost:8080/sky/cloud/", which also is the default.  
      skyQuery on success (if status code of request is 200) returns results of the called function. 
      skyQuery on failure (if status code of request is not 200) returns a Map of error information which contains;
              error - general error message.
              httpStatus - status code returned from http get command.
              skyQueryError - The value of the "error key", if it exist, of the function results.   
              skyQueryErrorMsg - The value of the "error_str", if it exist, of the function results.
              skyQueryReturnValue - The function call results.
    */
    skyQuery = function(eci, mod, func, params,_host,_path,_root_url) { // path must start with "/"", _host must include protocol(http:// or https://)
      //.../sky/cloud/<eci>/<rid>/<name>?name0=value0&...&namen=valuen
      createRootUrl = function (_host,_path){
        host = _host || meta:host;
        path = _path || "/sky/cloud/";
        root_url = host+path;
        root_url
      };
      root_url = _root_url || createRootUrl(_host,_path);
      web_hook = root_url + eci + "/"+mod+"/" + func;

      response = http:get(web_hook.klog("URL"), {}.put(params)).klog("response ");
      status = response{"status_code"};// pass along the status 
      error_info = {
        "error": "sky query request was unsuccesful.",
        "httpStatus": {
            "code": status,
            "message": response{"status_line"}
        }
      };
      // clean up http return
      response_content = response{"content"}.decode();
      response_error = (response_content.typeof() == "Map" && (not response_content{"error"}.isnull())) => response_content{"error"} | 0;
      response_error_str = (response_content.typeof() == "Map" && (not response_content{"error_str"}.isnull())) => response_content{"error_str"} | 0;
      error = error_info.put({"skyQueryError": response_error,
                              "skyQueryErrorMsg": response_error_str, 
                              "skyQueryReturnValue": response_content});
      is_bad_response = (response_content.isnull() || (response_content == "null") || response_error || response_error_str);
      // if HTTP status was OK & the response was not null and there were no errors...
      (status == 200 && not is_bad_response ) => response_content | error
    }


    getSelf = function(){
       wrangler:myself() // must be wrapped in a function
    }

    /*
      getSubscriptions([collectBy[, filterValue]]) with no arguments returns the
        value of ent:subscriptions (the subscriptions map)
      parameters:
        collectBy - if filterValue is omitted, the string or hashpath
          that indexes the subscriptions map values
          used to collect() each subscription map by

          e.g. if the subscriptions map is

          {
            "ns:n1": {
              "name": "ns:n1",
              "attributes": {
                "my_role": "peer",
                ...
              },
              ...
            },
            ...
          }

          getSubscriptions(["attributes", "my_role"]) returns

          {
            "peer": [
              {
                "ns:n1": {
                  "name": "ns:n1",
                  "attributes": {
                    "my_role": "peer",
                    ...
                  },
                  ...
                }
              },
              ...
            ],
            ...
          }

        filterValue - getSubscriptions(["attributes", "my_role"], "peer")
          returns the array indexed by "peer" above
    */
    getSubscriptions = function(collectBy, filterValue){
      subs = ent:subscriptions.defaultsTo({}, "no subscriptions");
      collectBy.isnull() => subs | function(){
        subArray = subs.keys().map(function(name){{}.put(name, subs{name})});
        filterValue.isnull() => subArray.collect(function(sub){
          sub.values()[0]{collectBy}
        }) | subArray.filter(function(sub){
          sub.values()[0]{collectBy} == filterValue
        })
      }()
    }

    standardOut = function(message) {
      msg = ">> " + message + " results: >>";
      msg
    }
    standardError = function(message) {
      error = ">> error: " + message + " >>";
      error
    } 

    // this only creates 5 random names; if none are unique keep prepending '_' and trying again

    randomSubscriptionName = function(name_space, name_base){
        base = name_base.defaultsTo("");
        subscriptions = getSubscriptions();
        array = 1.range(5).map(function(n){
          random:word()
          }).klog("randomWords");
        names = array.filter(function(name){
          subscriptions{name_space + ":" + base + name}.isnull()
        });
        names.length() > 0 => names[0].klog("uniqueName") | randomSubscriptionName(name_space, base + "_")
    }
    checkSubscriptionName = function(name , name_space, subscriptions){
      (subscriptions{name_space + ":" + name}.isnull())
    }
    mapWithHost = function(map, host){
      host.isnull() => map | map.put("subscriber_host", host)}
  }
  rule subscribeNameCheck {
    select when wrangler subscription
    pre {
      name_space = event:attr("name_space").defaultsTo("shared", standardError("name_space"))
      name   = event:attr("name") || randomSubscriptionName(name_space).klog("random name") //.defaultsTo(randomSubscriptionName(name_space), standardError("channel_name"))
      attrs = event:attrs().put({"name_space":name_space, "name":name}).klog("subscribeNameCheck attrs")
    }
    if(checkSubscriptionName(name , name_space, getSubscriptions())) then noop()
    fired{
      raise wrangler event "checked_name_subscription"
       attributes attrs
    }
    else{
      //error warn "duplicate subscription name, failed to send request "+name;
      //log(">> could not send request #{name} >>");
      logs.klog(">> could not send request #{name} >>")
    }
  }

  rule createMySubscription {
    select when wrangler checked_name_subscription
   pre {
      // attributes for inbound attrs
      logs = event:attrs().klog("createMySubscription attrs")
      name   = event:attr("name")
      name_space     = event:attr("name_space")
      my_role  = event:attr("my_role").defaultsTo("peer", standardError("my_role"))
      subscriber_host = event:attr("subscriber_host")
      subscriber_role  = event:attr("subscriber_role").defaultsTo("peer", standardError("subscriber_role"))
      subscriber_eci = event:attr("subscriber_eci").defaultsTo("no_subscriber_eci", standardError("subscriber_eci"))
      channel_type      = event:attr("channel_type").defaultsTo("subs", standardError("type"))
      attributes = event:attr("attrs").defaultsTo("status", standardError("attributes "))

      // create unique_name for channel
      unique_name = name_space + ":" + name
      logs = unique_name.klog("name")
      // build pending subscription entry
      pending_entry = mapWithHost({
        "subscription_name"  : name,
        "name_space"    : name_space,
        "relationship" : my_role +"<->"+ subscriber_role, 
        "my_role" : my_role,
        "subscriber_role" : subscriber_role,
        "subscriber_eci"  : subscriber_eci, // this will remain after accepted
        "status" : "outbound", // should this be passed in from out side? I dont think so.
        "attributes" : attributes
      }, subscriber_host).klog("pending entry")
      //create call back for subscriber     
      options = {
          "name" : unique_name, 
          "eci_type" : channel_type,
          "attributes" : pending_entry
          //"policy" : ,
      }.klog("options")
    }
    if(subscriber_eci != "no_subscriber_eci") // check if we have someone to send a request too
    then every {
       engine:newChannel(getSelf()["id"], options.name, options.eci_type) setting(channel);
    }
    fired {
      newSubscription = {"eci": channel.id, "name": channel.name,"type": channel.type, "attributes": options.attributes, "sovrin": channel.sovrin};
      updatedSubs = getSubscriptions().put([newSubscription.name] , newSubscription) ;
      newSubscription.klog(">> successful created subscription request >>");
      ent:subscriptions := updatedSubs;
      raise wrangler event "pending_subscription" attributes mapWithHost({
        "status" : pending_entry{"status"},
        "channel_name" : unique_name,
        "channel_type" : channel_type,
        "name" : pending_entry{"subscription_name"},
        "name_space" : pending_entry{"name_space"},
        "relationship" : pending_entry{"relationship"},
        "my_role" : pending_entry{"my_role"},
        "subscriber_role" : pending_entry{"subscriber_role"},
        "subscriber_eci"  : pending_entry{"subscriber_eci"},
        "inbound_eci" : newSubscription.eci,
        "verify_key_outbound" : newSubscription.sovrin.verifyKey,
        "attributes" : pending_entry{"attributes"}
      }, subscriber_host)
    } 
    else {
      logs.klog(">> failed to create subscription request, no subscriber_eci provided >>")
    }
  }

  
  rule sendSubscribersSubscribe {
    select when wrangler pending_subscription status re#outbound#
   pre {
      logs = event:attrs().klog("sendSubscribersSubscribe attrs")
      name   = event:attr("name")//.defaultsTo("standard",standardError("channel_name"))
      name_space     = event:attr("name_space")//.defaultsTo("shared", standardError("name_space"))
      subscriber_host = event:attr("subscriber_host")
      my_role  = event:attr("my_role")//.defaultsTo("peer", standardError("my_role"))
      subscriber_role  = event:attr("subscriber_role")//.defaultsTo("peer", standardError("subscriber_role"))
      subscriber_eci = event:attr("subscriber_eci").defaultsTo("no_subscriber_eci", standardError("subscriber_eci"))
      channel_type      = event:attr("channel_type")//.defaultsTo("subs", standardError("type"))
      attributes = event:attr("attributes")//.defaultsTo("status", standardError("attributes "))
      inbound_eci = event:attr("inbound_eci")
      channel_name = event:attr("channel_name")
    }
    if(subscriber_eci != "no_subscriber_eci") // check if we have someone to send a request too
    then
      event:send({
          "eci": subscriber_eci, "eid": "subscriptionsRequest",
          "domain": "wrangler", "type": "pending_subscription",
          "attrs": mapWithHost({"name"  : name,
             "name_space"    : name_space,
             "relationship" : subscriber_role +"<->"+ my_role ,
             "my_role" : subscriber_role,
             "subscriber_role" : my_role,
             "outbound_eci"  :  inbound_eci, 
             "status" : "inbound",
             "channel_type" : channel_type,
             "channel_name" : channel_name,
             "attributes" : attributes }, subscriber_host.isnull() => null | meta:host)
      }, subscriber_host)
    fired {
      subscriber_eci.klog(">> sent subscription request to >>")
    } 
    else {
      logs.klog(">> failed to send subscription request >>")
    }
  }

 rule addOutboundPendingSubscription {
    select when wrangler pending_subscription status re#outbound#
    always {
      raise wrangler event "outbound_pending_subscription_added" // event to nothing
        attributes event:attrs().klog(standardOut("successful outgoing pending subscription >>"))
    } 
  }

  rule InboundNameCheck {
    select when wrangler pending_subscription status re#inbound#
    pre {
      name_space = event:attr("name_space")
      name   = event:attr("name").klog("InboundNameCheck name")
      subscriber_host = event:attr("subscriber_host")
      outbound_eci = event:attr("outbound_eci")
      attrs = event:attrs()
    }
    if(checkSubscriptionName(name , name_space, getSubscriptions()) != true ) then noop()
    fired{
        attrs.klog(">> could not accept request #{name} >>");
        event:send({ "eci": outbound_eci, "eid": "pending_subscription",
          "domain": "wrangler", "type": "outbound_subscription_cancellation",
          "attrs": attrs.put({"failed_request":"not a unique subscription"})}, subscriber_host)
    }
    else{
      attrs.klog("InboundNameCheck attrs");
      raise wrangler event "checked_name_inbound"
       attributes attrs
  
    }
  }


  rule addInboundPendingSubscription { 
    select when wrangler checked_name_inbound
   pre {
        channel_name = event:attr("channel_name")//.defaultsTo("SUBSCRIPTION", standardError("channel_name")) 
        channel_type = event:attr("channel_type")//.defaultsTo("SUBSCRIPTION", standardError("type")) 
        status = event:attr("status").defaultsTo("", standardError("status"))
      subscriber_host = event:attr("subscriber_host")
      pending_subscriptions = 
         mapWithHost({
            "subscription_name"  : event:attr("name"),//.defaultsTo("", standardError("")),
            "name_space"    : event:attr("name_space").defaultsTo("", standardError("name_space")),
            "relationship" : event:attr("relationship").defaultsTo("", standardError("relationship")),
            "my_role" : event:attr("my_role").defaultsTo("", standardError("my_role")),
            "subscriber_role" : event:attr("subscriber_role").defaultsTo("", standardError("subscriber_role")),
            "outbound_eci"  : event:attr("outbound_eci").defaultsTo("", standardError("outbound_eci")),
            "status"  : status,
            "attributes" : event:attr("attributes").defaultsTo("", standardError("attributes"))
          }, subscriber_host)
          
      unique_name = channel_name
      options = {
        "name" : unique_name, 
        "eci_type" : channel_type,
        "attributes" : pending_subscriptions
          //"policy" : ,
      }
    }
    if checkSubscriptionName(unique_name)
    then every {
       engine:newChannel(getSelf()["id"], options.name, options.eci_type) setting(channel);
    }
    fired { 
      newSubscription = {
        "eci": channel.id,
        "name": channel.name,
        "type": channel.type,
        "attributes": options.attributes,
        "sovrin": channel.sovrin
      };
      logs.klog(standardOut("successful pending incoming"));
      ent:subscriptions := getSubscriptions().put( [newSubscription.name] , newSubscription );
      raise wrangler event "inbound_pending_subscription_added" // event to nothing
          attributes event:attrs()
    } 
  }

//  rule exchangeKeys {
//    select when wrangler inbound_pending_subscription_added
//    pre {
//       subscription = event:attr{"sub"}.klog("Sub 123412342");
//    }
//  }

// TODO:: THING
rule approveInboundPendingSubscription { 
    select when wrangler pending_subscription_approval
    pre{
      logs = event:attrs().klog("approveInboundPendingSubscription attrs")
      channel_name = event:attr("subscription_name").defaultsTo(event:attr("channel_name"), "channel_name used ")
      subs = getSubscriptions().klog("subscriptions")
      subscriber_host = subs{[channel_name,"attributes","subscriber_host"]}.klog("host of other pico if different")
      inbound_eci = subs{[channel_name,"eci"]}.klog("subscription inbound")
      outbound_eci = subs{[channel_name,"attributes","outbound_eci"]}.klog("subscriptions outbound")
      verify_key = subs{[channel_name]}.klog("subscription inbound")
      verify_key = verify_key{"sovrin"}{"verifyKey"}.klog("VERIFY KEY")
    }
    if (outbound_eci) then
      event:send({
          "eci": outbound_eci, "eid": "approvePendingSubscription",
          "domain": "wrangler", "type": "pending_subscription_approved",
          "attrs": {"outbound_eci" : inbound_eci , 
                      "status" : "outbound",
                      "channel_name" : channel_name,
                      "verify_key" : verify_key
                   }
          }, subscriber_host)
    fired 
    {
      logs.klog(standardOut(">> Sent accepted subscription events >>"));
      raise wrangler event "pending_subscription_approved" attributes {
        "channel_name" : channel_name,
        "status" : "inbound"
      }
    } 
    else 
    {
      logs.klog(standardOut(">> Failed to send accepted subscription events >>"))
    }
  }




  rule addOutboundSubscription { 
    select when wrangler pending_subscription_approved status re#outbound#
    pre{
      status = event:attr("status") 
      channel_name = event:attr("channel_name")
      subs = getSubscriptions()
      subscription = subs{channel_name}.klog("subscription addSubscription")
      attributes = subscription{["attributes"]}.klog("attributes subscriptions")
      attr = attributes.put({"status":"subscribed"}) // over write original status
      attrs = attr.put({"outbound_eci": event:attr("outbound_eci")}).klog("put outgoing outbound_eci: ") // add outbound_eci
      updatedSubscription = subscription.put({"attributes":attrs}).klog("updated subscriptions")
    }
    if (true) then
      event:send({
         "eci": updatedSubscription.attributes.outbound_eci, "eid": "sending_key",
         "domain": "wrangler", "type": "sending_key",
         "attrs": {
             "verify_key" : updatedSubscription.sovrin.verifyKey ,
             "sub_name" : updatedSubscription.name
         }
      })

    fired {
      subscription.klog(standardOut(">> success >>"));
      ent:subscriptions := getSubscriptions().put([updatedSubscription.name],updatedSubscription);
      raise wrangler event "subscription_added" attributes { // event to nothing
        "channel_name" : event:attr("channel_name")
      }
      }
  }

rule addInboundSubscription { 
    select when wrangler pending_subscription_approved status re#inbound#
    pre{
      status = event:attr("status") 
      channel_name = event:attr("channel_name")
      subs = getSubscriptions()
      subscription = subs{channel_name}.klog("subscription addSubscription")
      attributes = subscription{["attributes"]}.klog("attributes subscriptions")
      attr = attributes.put({"status":"subscribed"}) // over write original status
      atttrs = attr
      updatedSubscription = subscription.put({"attributes":atttrs}).klog("updated subscriptions")
    }
    if (true) then
      event:send(
              { "eci": updatedSubscription.attributes.outbound_eci, "eid": "sending_key",
                "domain": "wrangler", "type": "sending_key",
                "attrs": {
                    "verify_key" : updatedSubscription.sovrin.verifyKey ,
                    "sub_name" : updatedSubscription.name
                }
              })
    fired {
      ent:subscriptions := getSubscriptions().put([updatedSubscription.name],updatedSubscription);
      raise wrangler event "subscription_added" attributes {// event to nothing
        "channel_name" : event:attr("channel_name")
      };
    }
  }

  rule receiveKey {
    select when wrangler sending_key
    pre {
        test = event:attrs()
        name = event:attr("sub_name")
        verify_key = event:attr("verify_key")
        subscription = getSubscriptions(){name}
//        secret = engine:signMessage(verify_key, subscription.eci)
        updatedSubscription = subscription.put({"other_verify_key" : verify_key})
        updatedSubscription = updatedSubscription.put({"shared_secret" : secret})
    }
    always {
        ent:subscriptions := getSubscriptions().put([updatedSubscription.name],updatedSubscription);
    }
  }


  rule cancelSubscription {
    select when wrangler subscription_cancellation
            or  wrangler inbound_subscription_rejection
            or  wrangler outbound_subscription_cancellation
    pre{
      channel_name = event:attr("subscription_name").defaultsTo(event:attr("channel_name"), "channel_name used ") //.defaultsTo( "No channel_name", standardError("channel_name"))
      subs = getSubscriptions()
      subscriber_host = subs{[channel_name,"attributes","subscriber_host"]}.klog("outbound host if different")
      outbound_eci = subs{[channel_name,"attributes","subscriber_eci"]}.defaultsTo(
        subs{[channel_name,"attributes","outbound_eci"]}
      ).klog("other pico's eci")
    }
    event:send({
          "eci": outbound_eci, "eid": "cancelSubscription1",
          "domain": "wrangler", "type": "subscription_removal",
          "attrs": {
                    "channel_name": channel_name
                  }
          }, subscriber_host)
    always {
      channel_name.klog(standardOut(">> success >>"));
      raise wrangler event "subscription_removal" attributes {
        "channel_name" : channel_name
      }
          }
  } 

  rule removeSubscription {
    select when wrangler subscription_removal
    pre{
      channel_name = event:attr("channel_name").klog("channel_name")
      subs = getSubscriptions().klog("subscriptions")
      subscription = subs{channel_name}
      eci = subs{[channel_name,"eci"]}.klog("subscription inbound")
      updatedSubscription = subs.delete(channel_name).klog("delete")
    }
    engine:removeChannel(subscription{"eci"}.klog("eci to be removed"))
    always {
      ent:subscriptions := updatedSubscription;
      self = getSelf();
      subscription.klog(standardOut("success, attemped to remove subscription"));
      raise wrangler event "subscription_removed" attributes {// event to nothing
        "removed_subscription" : subscription
      }
    } 
  } 

}
