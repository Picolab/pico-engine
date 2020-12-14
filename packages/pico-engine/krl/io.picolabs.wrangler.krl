/* Rules with a public facing point of entry are camelCase, internal rules are snake_case
   For skyQuery and parent-child trees: 
    wrangler is built so that the parent can skyQuery its children for info at any time, 
    but children only get information from their direct parent through event-passing to prevent race conditions 
*/
ruleset io.picolabs.wrangler {
  meta {
    name "Wrangler Core"
    description <<
      Wrangler Core Module,
      use example: "use module io.picolabs.wrangler alias wrangler".
      This Ruleset/Module provides a developer interface to the pico (persistent computer object).
      When a pico is created or authenticated this ruleset will be installed to provide essential
      services.
    >>
    author "BYU Pico Lab"

    provides skyQuery ,
    rulesetsInfo,installedRulesets, installRulesets, uninstallRulesets,registeredRulesets, //ruleset
    channel, alwaysEci, nameFromEci, createChannel, newPolicy,//channel
    children, parent_eci, name, profile, pico, randomPicoName, pico, myself, isMarkedForDeath
    shares skyQuery ,
    rulesetsInfo,installedRulesets,registeredRulesets, //ruleset
    channel, alwaysEci, nameFromEci,//channel
    children, parent_eci, name, profile, pico, randomPicoName, pico,  myself, id, MAX_RAND_ENGL_NAMES, isMarkedForDeath, getPicoMap, timeForCleanup,
     __testing
  }
  global {
    __testing = { "queries": [  { "name": "channel", "args":["value","collection","filtered"] },
                                {"name":"skyQuery" , "args":["eci", "mod", "func", "params","_host","_path","_root_url"]},
                                {"name":"children" , "args":[]}
                                //{"name":"children" , "args":["name", "allowRogue"]},
                                ],
                  "events": [
                              { "domain": "wrangler", "name": "new_child_request",
                                "attrs": [ "name" , "backgroundColor"] },
                              { "domain": "wrangler", "name": "child_deletion",
                              "attrs": [ "id","name"] },
                              { "domain": "wrangler", "name": "child_sync",
                              "attrs": [ ] },
                              { "domain": "wrangler", "name": "channel_creation_requested",
                                "attrs": [ "name", "channel_type" ] },
                              { "domain": "wrangler", "name": "channel_deletion_requested",
                                "attrs": [ "eci" ] },
                              { "domain": "wrangler", "name": "install_rulesets_requested",
                                "attrs": [ "rids","url" ] },
                              { "domain": "wrangler", "name": "force_child_deletion",
                              "attrs": [ "id", "name"] }
                                ] }
                                
                                
// ********************************************************************************************
// ***                                                                                      ***
// ***                                      FUNCTIONS                                       ***
// ***                                                                                      ***
// ********************************************************************************************

    config= {"os_rids"        : [/*"io.picolabs.pds",*/"io.picolabs.wrangler","io.picolabs.visual_params"],
            "connection_rids": ["io.picolabs.subscription"] }
           
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
               skyQueryError - The value of the "error key", if it exist, aof the function results.
               skyQueryErrorMsg - The value of the "error_str", if it exist, of the function results.
               skyQueryReturnValue - The function call results.
     */
     QUERY_SELF_INVALID_HTTP_MAP = {"status_code": 400, 
                                    "status_line":"HTTP/1.1 400 Pico should not query itself",
                                    "content": "{\"error\":\"Pico should not query itself\"}"};
                                    
                                    
     buildWebHook = function(eci, mod, func, _host, _path, _root_url) {
         createRootUrl = function (_host,_path){
         host = _host || meta:host;
         path = _path || "/sky/cloud/";
         root_url = host+path;
         root_url
       };
       root_url = _root_url || createRootUrl(_host,_path);
       root_url + eci + "/"+mod+"/" + func;
     }
     
     processHTTPResponse = function(response) {
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
       (status == 200 && not is_bad_response) => response_content | error
     }
     
     skyQuery = function(eci, mod, func, params,_host,_path,_root_url) { // path must start with "/"", _host must include protocol(http:// or https://)
       //.../sky/cloud/<eci>/<rid>/<name>?name0=value0&...&namen=valuen
       thisPico = eci => engine:getPicoIDByECI(eci.defaultsTo("")) == meta:picoId | false;
       web_hook = buildWebHook(eci, mod, func, _host, _path, _root_url);

       response = (not thisPico) => http:get(web_hook, {}.put(params)) | QUERY_SELF_INVALID_HTTP_MAP;
       processHTTPResponse(response)
     }
    
/* NOT UPDATED FOR 1.0.0 */
    getPicoMap = function() {
      {
        "name":ent:name,
        "id":ent:id,
        "parent_eci":ent:parent_eci,
        "eci":ent:eci
      }
    }
    
/* NOT UPDATED FOR 1.0.0 */
    isMarkedForDeath = function() {
      ent:marked_for_death.defaultsTo(false)
    }
    
/* NOT UPDATED FOR 1.0.0 */
    timeForCleanup = function() {
      ent:default_timeout
    }
// ********************************************************************************************
// ***                                      Rulesets                                        ***
// ********************************************************************************************
/* NOT UPDATED FOR 1.0.0 */
    registeredRulesets = function() {
      engine:listAllEnabledRIDs()
    }

/* NOT UPDATED FOR 1.0.0 */
    rulesetsInfo = function(rids) {
      _rids = ( rids.typeof() == "Array" ) => rids | ( rids.typeof() == "String" ) => rids.split(";") | "" ;
      _rids.map(function(rid) {engine:describeRuleset(rid);});
    }
    
    //Given a semicolon-delimited array as a string or normal array returns a normal array
    //Checks attr1 then attr2 for the given array
     gatherGivenArray = function(attr1, attr2) {
      items = event:attr(attr1).defaultsTo(event:attr(attr2)).defaultsTo("");
      item_list = (items.typeof() ==  "Array") => items | items => items.split(re#;#) | [];
      item_list
    }

/* NOT UPDATED FOR 1.0.0 */
    installedRulesets = function() {
      engine:listInstalledRIDs(meta:picoId)
    }

/* NOT UPDATED FOR 1.0.0 */
    installRulesets = defaction(rids){
      every{
        engine:installRuleset(meta:picoId, rids) setting(new_ruleset)
      }
      return {"rids": new_ruleset}
    }

/* NOT UPDATED FOR 1.0.0 */
    installRulesetByURL = defaction(url){
      every{
        engine:installRuleset(meta:picoId, url=url) setting(new_ruleset)
      }
      return [new_ruleset]
    }

/* NOT UPDATED FOR 1.0.0 */
    uninstallRulesets = defaction(rids){
      every{
       engine:uninstallRuleset(meta:picoId, rids)
      }return{}
    }
    

// ********************************************************************************************
// ***                                      Channels                                        ***
// ********************************************************************************************
/* NOT UPDATED FOR 1.0.0 */
    channelNameExists = function(name){
      not channel(name, null, null).isnull()
    }
    
/* NOT UPDATED FOR 1.0.0 */
    channelNameExistsForType = function(name, type){
      channel_array = channel(null, "type", type);
      channel_array.any(function(channel){
        channel{"name"} == name
      });
    }

/* NOT UPDATED FOR 1.0.0 */
    nameFromEci = function(eci){ // internal function call
      channel = channel(eci,null,null);
      channel{"name"}
    }

/* NOT UPDATED FOR 1.0.0 */
    alwaysEci = function(value){   // always return a eci wether given a eci or name
      channels = engine:listChannels(meta:picoId);
      channel = channels.filter(function(chan){chan{"id"} == value || chan{"name"} == value}).head().defaultsTo({},"no channel found in alwayseci, by .head()");
      channel{"id"}
    }

/* NOT UPDATED FOR 1.0.0 */
    channel = function(value,collection,filtered) {
      channels = engine:listChannels(meta:picoId);

      single_channel = function(channels){
        channel_list = channels;
        result = channel_list.filter(function(chan){chan{"id"} == value || chan{"name"} == value}).head().defaultsTo(null,"no channel found, by .head()");
        (result)
      };
      type = function(chan){ // takes a chans
        group = (chan.typeof() ==  "Map")=> // for robustness check type.
        chan{collection} | "error";
        (group)
      };
      return1 = collection.isnull() => channels |  channels.collect(function(chan){(type(chan))}) ;
      return2 = filtered.isnull() => return1 | return1{filtered};
      (value.isnull()) => return2 | single_channel(channels)
    }

/* NOT UPDATED FOR 1.0.0 */
    deleteChannel = defaction(value) {
        channel = channel(value,null,null)
        eci = channel{"id"}
        engine:removeChannel(eci)
        return channel
    }

/* NOT UPDATED FOR 1.0.0 */
    createChannel = defaction(id , name, type, policy_id) {
      policy_present = policy_id => "T" | "F";
      choose policy_present {
        T => engine:newChannel(id , name, type, policy_id) setting(channel);
        F => engine:newChannel(id , name, type) setting(channel);
      }
      return channel
    }

    /*
      see https://github.com/Picolab/pico-engine/pull/350#issue-160657235 for information on the format of @param new_policy and the return value
    */
/* NOT USED IN 1.0.0 */
    newPolicy = defaction(new_policy) {
      every{
        engine:newPolicy( new_policy ) setting(created_policy)
      }
      return created_policy
    }

// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
/* NOT UPDATED FOR 1.0.0 */
    myself = function(){
      {
        "name":ent:name,
        "id":ent:id,
        "eci":ent:eci
      }
    }
    
/* NOT UPDATED FOR 1.0.0 */
    childrenAsMap = function() {
      ent:wrangler_children
    }
  
    children = function(name, allowRogue = true) {
      convert = function(eci){
        pico = {}
          .put("eci",eci)
          .put("name",ctx:query(eci,"io.picolabs.pico-engine-ui","name"))
          .put("parent_eci",ctx:query(eci,ctx:rid,"parent_eci"))
        pico
      }
      wrangler_children = ctx:children
        .map(convert)
      wrangler_children
/* NOT UPDATED FOR 1.0.0 */
/*
      ((allowRogue && not name) => ent:wrangler_children | 
                                   ent:wrangler_children.filter(function(pico, ID) {
                                                                  rogueCheck = allowRogue || (not allowRogue && not pico{"rogue"});
                                                                  nameCheck = not name || (name && name == pico{"name"});
                                                                  (rogueCheck && nameCheck)
                                                                })
                                                                ).values()
*/
    }
    
/* NOT UPDATED FOR 1.0.0 */
    getChild = function(id) {
      ent:wrangler_children{id}
    }
  
    parent_eci = function() {
      ctx:parent
    }
  
/* NOT UPDATED FOR 1.0.0 */
    profile = function(key) {
      /*PDS not implemented */ //pds:profile(key)
      {}
    }
/* NOT UPDATED FOR 1.0.0 */
    pico = function() {
      profile_return = {};/*PDS not implemented */ //pds:profile();
      settings_return = {};/*PDS not implemented */ //pds:settings();
      general_return = {};/*PDS not implemented */ //pds:items();
      {
        "profile" : profile_return{"profile"},
        "settings" : settings_return{"settings"},
        "general" : general_return{"general"}
      }
    }
  
    name = function() {
      ent:name
    }
  
/* NOT UPDATED FOR 1.0.0 */
    id = function() {
      meta:picoId
    }
  
    // deprecated -> the client can do this themselves, and pico names no longer have to be unique
/* NOT UPDATED FOR 1.0.0 */
    picoECIFromName = function (name) {
      pico = ent:wrangler_children.filter(function(rec){rec{"name"} ==  name})
                                  .head();
      pico{"eci"}
    }
  
    //returns a list of children that are contained in a given subtree at the starting child. Leaves *will* be listed before their parents
    gatherDescendants = function(childID){
      moreChildren = engine:listChildren(childID);
      
      gatherChildrensChildren = function(moreChildren){
        arrayOfChildrenArrays = moreChildren.map(function(x){ gatherDescendants(x) });
        arrayOfChildrenArrays.reduce(function(a,b){ a.append(b) });
      };
      
      result = (moreChildren.length() == 0) => [] | gatherChildrensChildren(moreChildren).append(moreChildren);
      result
    }
    
    //deprecated
/* NOT UPDATED FOR 1.0.0 */
    picoFromName = function(value){
      ret = children().defaultsTo([]).filter(function(child){
                                              (child{"name"} ==  value || child{"id"} == value)});
      ret.head().defaultsTo("Error")//no pico exists for given name
    }
    
    //deprecated
/* NOT UPDATED FOR 1.0.0 */
    hasChild = function(value){
      children().filter(function(child){
                          child{"name"} ==  value || child{"id"} == value
                          }).head()
    }
    
    /*
    IN: a map that can contain
          an "id" key mapped to a child Pico ID
          a "name" attribute
          a "delete_all" key mapped to a boolean value
        a boolean value "allowRogue"
    OUT: A map containing the picos to be deleted
          If "id" is provided the child pico with that ID will be in the map
          If "name" is provided all picos with that name will be in the map
          If "delete_all" is provided all children will be in the map
          If allowRogue is provided true, all rogue children (children w/out wrangler) will be included in the search, otherwise they will not be selected for
    */
/* NOT UPDATED FOR 1.0.0 */
    getPicosToDelete = function(deleteMap, allowRogue = false) {
      givenPicoID = deleteMap{"id"};
      nameToDelete = deleteMap{"name"};
      deleteAll = deleteMap{"delete_all"};
      filteredForRogue = allowRogue => ent:wrangler_children | ent:wrangler_children.filter(function(pico, ID){not pico{"rogue"}}); 
    
      deleteAll => 
      filteredForRogue |
      filteredForRogue.filter(function(childMap,childID){
        childMap{"name"} == nameToDelete || childMap{"id"} == givenPicoID
      });
    }
    
    // Creates a map with a similar shape of ent:wrangler_children using engine calls, given pico IDs for children of this pico.
    // Will also try and ask those children if they have wrangler installed and use that info instead if they do.
    // Assumes the target picos have an admin channel of type secret.
/* NOT UPDATED FOR 1.0.0 */
    getChildMapFromIDs = function(picoIDs) {
      picoIDs.collect(function(id){id})
             .map(function(picoIDArray){
                picoID = picoIDArray[0]; // Array of 1 from collect
                grabbedChannel = engine:listChannels(picoID).reduce(function(channel_a, channel_b) {
                                                                      channel_a => channel_a |
                                                                      channel_b{"name"} == "main" && channel_b{"type"} == "wrangler" => channel_b |
                                                                      channel_b{"name"} == "admin" && channel_b{"type"} == "secret" => channel_b |
                                                                      channel_a
                                                                     }, null);
                //channelKeys = grabbedChannels.keys().klog("observed channel map keys are: ");
                grabbedEci = grabbedChannel{"id"};
                attemptedMap = skyQuery(grabbedEci, meta:rid, "getPicoMap");
                attemptedMap{"error"}.isnull() => attemptedMap.put("eci", grabbedEci) |
                                                  {
                                                    "id":picoID,
                                                    "parent_eci":"",
                                                    "name":"rogue_" + random:uuid(),
                                                    "eci": grabbedEci,
                                                    "rogue":true
                                                  }
      })
    }

/* NOT UPDATED FOR 1.0.0 */
    createPico = defaction(name, rids, rids_from_url){
      every{
        engine:newChannel(meta:picoId, name, "children") setting(parent_channel);// new eci for parent to child
        engine:newPico() setting(child);// newpico
        engine:newChannel(child{"id"}, "main", "wrangler"/*"secret"*/) setting(channel);// new child root eci
        engine:installRuleset(child{"id"},config{"os_rids"});// install child OS
        event:send( // introduce child to itself and parent
          { "eci": channel{"id"},
            "domain": "wrangler", 
            "type": "child_created",
            "attrs": 
                event:attrs.put(({
                "parent_eci": parent_channel{"id"},
                "name": name,
                "id" : child{"id"},
                "eci": channel{"id"},
                "rids_to_install": rids.defaultsTo([]).append(config{"connection_rids"}),
                "rids_from_url": rids_from_url.defaultsTo([])
            }))
          });
      }
      return {
       "parent_eci": parent_channel{"id"},
       "name": name,
       "id" : child{"id"},
       "eci": channel{"id"}
      }
    }

    MAX_RAND_ENGL_NAMES = 200
    
/* NOT UPDATED FOR 1.0.0 */
    randomPicoName = function(){
        w_children = children();
        generateName = function() {
          word = random:word();
          w_children.none(function(child){child{"name"} == word}) => word | generateName()
        };
        
        w_children.length() > MAX_RAND_ENGL_NAMES => random:uuid() | generateName()
    }
    

  }
  
  // ********************************************************************************************
// ***                                                                                      ***
// ***                                      Utility                                         ***
// ***                                                                                      ***
// ********************************************************************************************

/* NOT UPDATED FOR 1.0.0 */
  rule asyncSkyQuery {
    select when wrangler asyncSkyQuery 
    pre {
      
    }
  }


// ********************************************************************************************
// ***                                                                                      ***
// ***                                      System                                          ***
// ***                                                                                      ***
// ********************************************************************************************
/* NOT USED IN 1.0.0 */
  rule systemOnLine {
    select when system online
    foreach children() setting(child)
      event:send({ "eci"   : child{"eci"},
                   "domain": "system", "type": "online",
                   "attrs" : event:attrs })  
    }
// ********************************************************************************************
// ***                                                                                      ***
// ***                                      Rulesets                                        ***
// ***                                                                                      ***
// ********************************************************************************************

  
/* NOT UPDATED FOR 1.0.0 */
  rule installURLRulesets {
    select when wrangler install_rulesets_requested
    foreach gatherGivenArray("urls","url") setting(url)
    every {
      installRulesetByURL(url) setting(rids)
      send_directive("rulesets installed", { "rids": rids });
    }
    fired{
      raise wrangler event "ruleset_added" 
        attributes event:attrs.put("rids", rids);
    }
  }
  
/* NOT UPDATED FOR 1.0.0 */
    rule installRulesets {
    select when wrangler install_rulesets_requested
    pre {
      rid_list = gatherGivenArray("rids", "rid")
      valid_rids = rid_list.intersection(registeredRulesets())
      invalid_rids = rid_list.difference(valid_rids)
      initial_install = event:attr("init").defaultsTo(false) // if this is a new pico
    }
    if valid_rids.length() > 0 then every{
      installRulesets(valid_rids) setting(rids)
      send_directive("rulesets installed", { "rids": rids{"rids"} });
    }
    fired {
      raise wrangler event "ruleset_added"
        attributes event:attrs.put(["rids"], rids{"rids"})
    }
    finally {
      raise wrangler event "install_rulesets_error"
        attributes event:attrs.put(["rids"],invalid_rids) if invalid_rids.length() > 0;
      raise wrangler event "finish_initialization"
        attributes event:attrs.put("rids", rids{"rids"})  if initial_install == true;
    }
  }

  rule install_ruleset_relatively {
    select when wrangler install_ruleset_request
      absoluteURL re#(.+)#   // required
      rid re#(.+)#           // required
      setting(absoluteURL,rid)
    pre {
      parts = absoluteURL.split("/")
      url = parts.splice(parts.length()-1,1,rid+".krl").join("/")
    }
    fired {
      raise wrangler event "install_ruleset_request"
        attributes {"url":url, "config":event:attr("config")}
    }
  }

  rule install_ruleset_absolutely {
    select when wrangler install_ruleset_request
      url re#(.+)#           // required
      setting(url)
    pre {
      config = event:attr("config") || {}
      rid = url.extract(re#.*/([^/]+)[.]krl$#).head()
    }
    ctx:install(url=url,config=config)
    fired {
      raise wrangler event "ruleset_installed"
        attributes event:attrs.put({"rids": [rid]})
    }
  }

/* NOT UPDATED FOR 1.0.0 */
  rule uninstallRulesets {
    select when wrangler uninstall_rulesets_requested
    pre {
      rid_list = gatherGivenArray("rids", "rid")
    } every{
      uninstallRulesets(rid_list)
      send_directive("rulesets uninstalled", {"rids":rid_list});
    }
  }

// ********************************************************************************************
// ***                                      Channels                                        ***
// ********************************************************************************************

/* NOT UPDATED FOR 1.0.0 */
  rule createChannel {
    select when wrangler channel_creation_requested
    pre { 
      channel_name = event:attr("name") 
      channel_type = event:attr("type").defaultsTo("_wrangler")
    }
    if(not channelNameExistsForType(channel_name, channel_type) && not channel_name.isnull() ) then every {
      createChannel(meta:picoId,
                    channel_name,
                    channel_type,
                    event:attr("policy_id")) setting(channel);
      send_directive("channel_Created", channel);
    }
    fired {
      raise wrangler event "channel_created" // API event
            attributes event:attrs.put(["channel"], channel);
    } else {
      error info <<could not create channel #{channel_name}.>>
    }
  }

/* NOT UPDATED FOR 1.0.0 */
  rule deleteChannel {
    select when wrangler channel_deletion_requested
    pre {
      eci = alwaysEci(event:attr("eci")
                     .defaultsTo(event:attr("name")
                     .defaultsTo("")))
    }
    if eci then
    every {
      deleteChannel(eci) setting(channel);
      send_directive("channel_deleted", channel);
    }
    fired {
      raise wrangler event "channel_deleted" // API event
           attributes event:attrs.put(["channel"],channel)
    } else {
     raise wrangler event "channel_deletion_failed" attributes event:attrs.put(
       "reason","No channel found for info given")
    }
  }


// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
  //-------------------- Picos initializing  ----------------------
/* NOT UPDATED FOR 1.0.0 */
/*
  rule createChild {
    select when wrangler child_creation or wrangler new_child_request
    pre {
      given_name = event:attr("name").defaultsTo("");
      name = given_name.length() == 0 => randomPicoName() | given_name;
      rids = gatherGivenArray("rids","rid")
      url_rids = gatherGivenArray("rids_from_url")
      target_notify_rid = event:attr("notify_rid")
    }
    // If we have a name and this pico isn't currently trying to destroy itself
    if (name) && not (isMarkedForDeath()) then every {
      createPico(name, rids, url_rids) setting(child)
      send_directive("Pico_Created", {"pico":child});
    }
    fired {
      ent:wrangler_children{child{"id"}} := child;
      raise wrangler event "new_child_created" attributes event:attrs.put(child) if not target_notify_rid;
      raise wrangler event "new_child_created" for target_notify_rid attributes event:attrs.put(child) if target_notify_rid
    }
    else{
      raise wrangler event "child_creation_failure"
        attributes event:attrs
    }
  }
*/

  rule createChild {
    select when wrangler new_child_request
      name re#.+#
      backgroundColor re#.*#
    pre {
      name = event:attrs{"name"}
      backgroundColor = event:attrs{"backgroundColor"} || "#87CEFA"
      engine_ui_rid = "io.picolabs.pico-engine-ui"
      engine_ui_ruleset = function(){
        the_ruleset = ctx:rulesets
          .filter(function(r){r.get("rid")==engine_ui_rid})
          .head();
        { "url":the_ruleset.get("url"),
          "config":the_ruleset.get("config")
        }
      }
      subscription_ruleset_url = function(){
        subscription_rid = "io.picolabs.subscription"
        parts = ctx:rid_url.split("/")
        parts.splice(parts.length()-1,1,subscription_rid+".krl").join("/")
      }
      subs_url = subscription_ruleset_url().klog("subs_url")
    }
    every {
      ctx:newPico(rulesets=[
        engine_ui_ruleset(),
        { "url": ctx:rid_url, "config": {} }
      ]) setting(newEci)
      ctx:event(
        eci=newEci,
        domain="wrangler",
        name="install_ruleset_request",
        attrs={
          "url": subs_url
        }
      )
      ctx:eventQuery(
        eci=newEci,
        domain="engine_ui",
        name="setup",
        rid=engine_ui_rid,
        queryName="uiECI"
      ) setting(newUiECI)
      ctx:event(
        eci=newUiECI,
        domain="engine_ui",
        name="box",
        attrs={
          "name": name,
          "backgroundColor": backgroundColor
        }
      )
    }
    fired {
      raise wrangler event "new_child_created"
        attributes event:attrs.put({"eci":newEci})
    } else {
      raise wrangler event "child_creation_failure"
        attributes event:attrs
    }
  }

  rule createChild_failure {
    select when wrangler child_creation_failure
      send_directive("Pico_Not_Created", {});
    always {
      error info <<Failed to create pico>>;
    }
  }

/* NOT UPDATED FOR 1.0.0 */
  rule initialize_child_after_creation {
    select when wrangler child_created
    pre {
      rids_to_install = event:attr("rids_to_install")
      rids_to_install_from_url = event:attr("rids_from_url")
    }
    if rids_to_install.length() > 0 || rids_to_install_from_url.length() > 0 then
    noop()
    fired {
      raise wrangler event "install_rulesets_requested"
        attributes event:attrs.put("init", true)
                              .put(["rids"], rids_to_install)
                              .put(["urls"], rids_to_install_from_url)
    }
    else {
      raise wrangler event "finish_initialization"
        attributes event:attrs
    }
    finally {
      ent:parent_eci := event:attr("parent_eci");
      ent:name := event:attr("name");
      ent:id := event:attr("id");
      ent:eci := event:attr("eci");
      ent:wrangler_children := {};
      ent:default_timeout := {"minutes":5}
    }
  }

/* NOT UPDATED FOR 1.0.0 */
  rule finish_child_initialization {
    select when wrangler finish_initialization
      event:send({ "eci"   : event:attr("parent_eci"),
                   "domain": "wrangler", "type": "child_initialized",
                   "attrs" : event:attrs })
    always {
      raise visual event "update"
        attributes event:attrs.put("dname",event:attr("name"))
    }
  }
  
  // this pico is the primary pico

/* NOT USED IN 1.0.0 */
  rule pico_root_created {
    select when wrangler root_created
    always {
      ent:id := meta:picoId;
      ent:eci := event:attr("eci");
      ent:wrangler_children := {};
      //ent:children := {};
      ent:name := "Root Pico";
      raise wrangler event "install_rulesets_requested" attributes {
        "rid":"io.picolabs.subscription"
      }
    }
  }
    
    
  
  //-------------------- PARENT PERSPECTIVE  ----------------------
  rule deleteOneChild {
    select when wrangler child_deletion_request
      eci re#^(.+)$# setting(eci)
    ctx:delPico(eci)
    fired {
      raise wrangler event "child_deleted"
        attributes event:attrs
    }
  }

/* NOT UPDATED FOR 1.0.0 */
  rule deleteChild {
    select when wrangler child_deletion or wrangler delete_children
    pre {
      picoIDMap = getPicosToDelete(event:attrs).filter(function(pico,id){
        not pico{"rogue"}  
      })//.klog("Found these picos to delete: ");
      picoIDArray = picoIDMap.keys();
    }
    send_directive("pico_ids_to_delete", {"ids":picoIDArray})
    always {
      ent:children_being_deleted := ent:children_being_deleted.defaultsTo({}).put(picoIDMap);
      raise wrangler event "send_intent_to_delete" attributes event:attrs.put({
        "picoIDArray":picoIDArray
      });
    }
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule send_intent_to_delete {
    select when wrangler send_intent_to_delete
    foreach event:attr("picoIDArray") setting (picoID)
    pre {
      picoEci = ent:wrangler_children{[picoID, "eci"]};
      attrsToSend = event:attrs.delete("picoIDArray")
  
    }
    event:send({"eci":picoEci, "domain":"wrangler", "type":"intent_to_delete_pico", "attrs":attrsToSend});
    always {
      clear ent:wrangler_children{picoID}
    }
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule delete_child {
    select when wrangler child_ready_for_deletion
    pre {
      picoID = event:attr("id");
    }
    every{
      engine:removePico(picoID)
      deleteChannel(event:attr("parent_eci"))
      send_directive("pico_deleted",{"pico":picoID})
    }
    always{
      clear ent:children_being_deleted{picoID};
      raise wrangler event "child_deleted"
        attributes event:attrs;
    }
  }
  
  // Sync with children that may not have been created or deleted by wrangler.
  // Assumes all picos have a channel of type "admin" with a policy that will allow all events from a parent ruleset
  // If the child does not have wrangler installed, any wrangler event chains requiring child cooperation will not work
/* NOT UPDATED FOR 1.0.0 */
  rule syncChildren {
    select when wrangler child_sync
                         or wrangler force_child_deletion
                         or wrangler force_children_deletion
    pre {
      // Children that wrangler knows about
      wranglerChildren = ent:wrangler_children.keys();
      engineChildren = engine:listChildren();
      
      //Children that exist but wrangler doesn't know about
      ghostChildren = engineChildren.difference(wranglerChildren);
      
      ghostChildrenMap = getChildMapFromIDs(ghostChildren)
      
      //Children that don't exist but wrangler still has record of
      extraChildren = wranglerChildren.difference(engineChildren)
    }
    always {
      ent:wrangler_children := ent:wrangler_children.filter(function(v,picoID){
         not (picoID >< extraChildren)
      });
      ent:wrangler_children := ent:wrangler_children.put(ghostChildrenMap); // Possible to do root-level map merge?
    
      raise wrangler event "ghost_children_added" attributes 
        event:attrs.put("found_children", ghostChildrenMap) if ghostChildrenMap.keys().length() > 0;
      raise wrangler event "nonexistent_children_removed" attributes
        event:attrs.put("removed_children", extraChildren) if extraChildren.length() > 0
      
    }
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule forceChildrenDeletion {
    select when wrangler force_child_deletion or wrangler force_children_deletion
    pre {
      picoIDArray = getPicosToDelete(event:attrs, true).keys();
      picoSubtreeArrays = picoIDArray.map(function(picoID) {
        gatherDescendants(picoID)
      })
      flatArray = picoSubtreeArrays.reduce(function(id_array_a, id_array_b){
                                            id_array_a.append(id_array_b);
                                          }, []).append(picoIDArray)
    }
    send_directive("pico_ids_to_force_delete", {"pico_ids":flatArray})
    always {
      raise wrangler event "picos_to_force_delete_ready" attributes event:attrs
                                                                    .put("picoIDArray", flatArray)
    }
  }
    
/* NOT UPDATED FOR 1.0.0 */
  rule delete_each_pico_id {
    select when wrangler picos_to_force_delete_ready
    foreach event:attr("picoIDArray") setting (picoID)
    
    engine:removePico(picoID)
    
    always {
      clear ent:wrangler_children{picoID};
      clear ent:children_being_deleted{picoID}; // if was already trying to be deleted through wrangler
      raise wrangler event "pico_forcibly_removed" attributes event:attrs
                                                                 .delete("picoIDArray")
                                                                 .put("id", picoID)
    }
  }
  
    //-------------------- CHILD PERSPECTIVE  ----------------------
    
/* NOT UPDATED FOR 1.0.0 */
  rule parent_requested_deletion {
    select when wrangler intent_to_delete_pico
    always {
      ent:marked_for_death := true;
      raise visual event "update"
        attributes {}.put("dname","Deleting").put("color", "#000000");
      raise wrangler event "delete_children" attributes event:attrs
                                                        .put("delete_all", true);
      raise wrangler event "rulesets_need_to_cleanup" attributes event:attrs;
      schedule wrangler event "pico_cleanup_timed_out" 
        at time:add(time:now(), ent:default_timeout.defaultsTo({"minutes":5}))
        attributes event:attrs
        setting(scheduled_timeout);
      ent:scheduled_timeout_event := scheduled_timeout;
      ent:saved_attrs := event:attrs
    }  
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule setDeletionTimeoutPeriod {
    select when wrangler set_timeout_before_pico_deleted
    pre{
      new_timeout_obj = event:attr("new_timeout")
    }
    if time:add(time:now(), new_timeout_obj) then // see if it can be used to determine a new time
    noop()
    fired {
      ent:default_timeout := new_timeout_obj;
      raise wrangler event "timeout_before_pico_deleted_changed" attributes
        event:attrs.put("new_timeout", new_timeout_obj)
     } 
     // function hard-fails, error-checking not possible
     //else {
    //   raise wrangler event "timeout_before_pico_deleted_update_failed" attributes
    //     event:attrs.put("malformed new timeout time")
    // } 
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule registerForCleanup {
    select when wrangler ruleset_needs_cleanup_period
    pre {
      domain = event:attr("domain")
    }
    if domain && not ent:marked_for_death then
    noop()
    fired {
      ent:registered_for_cleanup := ent:registered_for_cleanup.defaultsTo([]).append(domain);
    }
    else {
      raise wrangler event "cleanup_domain_registration_failure" attributes event:attrs.put(
        "error","Failed to register domain for cleanup guarantee"
      )
    }
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule cleanupFinished {
    select when wrangler cleanup_finished
    pre {
      domain = event:attr("domain")
    }
    always {
      ent:registered_for_cleanup := ent:registered_for_cleanup.filter(function(registeredDomain) {
        registeredDomain != domain
      });
    }
  }
  
/* NOT UPDATED FOR 1.0.0 */
  rule cleanup_timed_out {
    select when wrangler pico_cleanup_timed_out
    always{
      raise wrangler event "force_children_deletion" attributes event:attrs.put({
        "delete_all":true
      });
      ent:registered_for_cleanup := [];
    }
  }
    
/* NOT UPDATED FOR 1.0.0 */
  rule is_pico_ready_to_delete {
    select when wrangler intent_to_delete_pico or     // if was ready when first asked to be deleted
                wrangler cleanup_finished or          // if a ruleset just finished cleaning up
                wrangler child_ready_for_deletion or  // if we just deleted a child
                wrangler delete_this_pico_if_ready or // manual trigger
                wrangler pico_cleanup_timed_out or    // if we timed out waiting for cleanup
                wrangler pico_forcibly_removed        // if we timed out waiting for cleanup and needed to delete picos
    pre {
      ready_to_delete = ent:marked_for_death
                        &&  ent:children_being_deleted.defaultsTo([]).length() == 0
                        &&  ent:registered_for_cleanup.defaultsTo([]).length() == 0;
    }
    if ready_to_delete then
      every {
      schedule:remove(ent:scheduled_timeout_event)
      event:send({"eci":parent_eci(), "domain":"wrangler", "type":"child_ready_for_deletion", "attrs":event:attrs
                                                                                                      .put(ent:saved_attrs.defaultsTo({}))
                                                                                                      .put(getPicoMap())
      })
      }
  }

}//end ruleset
