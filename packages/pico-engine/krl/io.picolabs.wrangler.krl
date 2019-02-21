// operators are camel case, variables are snake case.

ruleset io.picolabs.wrangler {
  meta {
    name "Wrangler Core"
    description <<
      Wrangler Core Module,
      use example, use module v1_wrangler alias wrangler .
      This Ruleset/Module provides a developer interface to the PICO (persistent computer object).
      When a PICO is created or authenticated this ruleset will be installed to provide essential
      services.
    >>
    author "BYU Pico Lab"

    logging on
    provides skyQuery ,
    rulesetsInfo,installedRulesets, installRulesets, uninstallRulesets,registeredRulesets, //ruleset
    channel, alwaysEci, eciFromName, nameFromEci, createChannel, newPolicy,//channel
    children, parent_eci, name, profile, pico, uniquePicoName, randomPicoName, createPico, deleteChild, pico, myself
    shares skyQuery ,
    rulesetsInfo,installedRulesets,  installRulesets, uninstallRulesets,registeredRulesets, //ruleset
    channel, alwaysEci, eciFromName, nameFromEci,//channel
    children, parent_eci, name, profile, pico, uniquePicoName, randomPicoName, createPico, deleteChild, pico,  myself, MAX_RAND_ENGL_NAMES,
     __testing
  }
  global {
    __testing = { "queries": [  { "name": "channel", "args":["value","collection","filtered"] },
                                {"name":"skyQuery" , "args":["eci", "mod", "func", "params","_host","_path","_root_url"]},
                                {"name":"children" , "args":[]} ],
                  "events": [ { "domain": "wrangler", "type": "child_creation",
                                "attrs": [ "name" ] },
                              { "domain": "wrangler", "type": "child_deletion",
                                "attrs": [ "name"] },
                              { "domain": "wrangler", "type": "child_deletion",
                              "attrs": [ "id"] },
                              { "domain": "wrangler", "type": "channel_creation_requested",
                                "attrs": [ "name", "type" ] },
                              { "domain": "wrangler", "type": "channel_deletion_requested",
                                "attrs": [ "eci" ] },
                              { "domain": "wrangler", "type": "install_rulesets_requested",
                                "attrs": [ "rids" ] },
                              { "domain": "wrangler", "type": "deletion_requested",
                                "attrs": [ ] } ] }
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

       response = http:get(web_hook, {}.put(params));
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

    //returns a list of children that are contained in a given subtree at the starting child. No ordering is guaranteed in the result
    gatherDescendants = function(child){
      moreChildren = skyQuery(child{"eci"}, "io.picolabs.wrangler", "children");
      //final_pico_array = [child].append(moreChildren);

      gatherChildrensChildren = function(moreChildren){
        arrayOfChildrenArrays = moreChildren.map(function(x){ gatherDescendants(x) });
        arrayOfChildrenArrays.reduce(function(a,b){ a.append(b) });
      };

      result = (moreChildren.length() == 0) => [] | moreChildren.append(gatherChildrensChildren(moreChildren));
      result
    }

    picoFromName = function(value){
      return = children().defaultsTo([]).filter(function(child){
                                              (child{"name"} ==  value || child{"id"} == value)});
      return.head().defaultsTo("Error")//no pico exists for given name
    }

    deleteChild = defaction(pico_name){
      ent_children = children()
      child_collection = ent_children.collect(function(child){
                                              (child{"name"} ==  pico_name) => "to_delete" | "dont_delete"
                                            })
      child_to_delete = child_collection{"to_delete"}.head()

      every {
        engine:removePico(child_to_delete{"id"})
      }
      returns
      {
        "updated_children": child_collection{"dont_delete"},
        "child": child_to_delete
      }
    }

    hasChild = function(value){
      children().filter(function(child){
                          child{"name"} ==  value || child{"id"} == value
                          }).head()
    }
// ********************************************************************************************
// ***                                      Rulesets                                        ***
// ********************************************************************************************
    registeredRulesets = function() {
      engine:listAllEnabledRIDs()
    }

    rulesetsInfo = function(rids) {
      _rids = ( rids.typeof() == "Array" ) => rids | ( rids.typeof() == "String" ) => rids.split(";") | "" ;
      _rids.map(function(rid) {engine:describeRuleset(rid);});
    }

    installedRulesets = function() {
      engine:listInstalledRIDs(meta:picoId)
    }

    installRulesets = defaction(rids){
      every{
        engine:installRuleset(meta:picoId, rids) setting(new_ruleset)
      }
      returns {"rids": new_ruleset}
    }

    uninstallRulesets = defaction(rids){
      every{
       engine:uninstallRuleset(meta:picoId, rids)
      }returns{}
    }

// ********************************************************************************************
// ***                                      Channels                                        ***
// ********************************************************************************************
    checkName = function(name){
      channel(name, null, null).isnull()
    }

    nameFromEci = function(eci){ // internal function call
      channel = channel(eci,null,null);
      channel{"name"}
    }
    eciFromName = function(name){
      channel = channel(name,null,null);
      channel{"id"}
    }

    alwaysEci = function(value){   // always return a eci wether given a eci or name
      channels = engine:listChannels(meta:picoId);
      channel = channels.filter(function(chan){chan{"id"} == value || chan{"name"} == value}).head().defaultsTo({},"no channel found in alwayseci, by .head()");
      channel{"id"}
    }

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

    deleteChannel = defaction(value) {
        channel = channel(value,null,null)
        eci = channel{"id"}
        engine:removeChannel(eci)
        returns channel
    }

    createChannel = defaction(id , name, type, policy_id) {
      policy_present = policy_id => "T" | "F";
      choose policy_present {
        T => engine:newChannel(id , name, type, policy_id) setting(channel);
        F => engine:newChannel(id , name, type) setting(channel);
      }
      returns  channel
    }

    /*
      see https://github.com/Picolab/pico-engine/pull/350#issue-160657235 for information on the format of @param new_policy and the return value
    */
    newPolicy = defaction(new_policy) {
      every{
        engine:newPolicy( new_policy ) setting(created_policy)
      }
      returns created_policy
    }

// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
  myself = function(){
      { "id": ent:id, "eci": ent:eci, "name": ent:name }
  }

  children = function(name) {
    _children = ent:wrangler_children.defaultsTo({});
    (name => _children.filter(function(child){child{"name"} == name}) | _children).values()
  }

  parent_eci = function() {
    ent:parent_eci.defaultsTo("")
  }

  profile = function(key) {
    /*PDS not implemented */ //pds:profile(key)
    {}
  }
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
  picoECIFromName = function (name) {
    pico = ent:wrangler_children.filter(function(rec){rec{"name"} ==  name})
                          .head();
    pico{"eci"}
  }

    createPico = defaction(name, rids){
      every{
        engine:newChannel(meta:picoId, name, "children") setting(parent_channel);// new eci for parent to child
        engine:newPico() setting(child);// newpico
        engine:newChannel(child{"id"}, "main", "wrangler"/*"secret"*/) setting(channel);// new child root eci
        engine:installRuleset(child{"id"},config{"os_rids"});// install child OS
        event:send( // introduce child to itself and parent
          { "eci": channel{"id"},
            "domain": "wrangler", "type": "child_created",
            "attrs": ({
              "parent_eci": parent_channel{"id"},
             "name": name,
             "id" : child{"id"},
             "eci": channel{"id"},
             "rids_to_install": rids.defaultsTo([]).append(config{"connection_rids"}),
             "rs_attrs":event:attrs
            })
            });
      }
      returns {
       "parent_eci": parent_channel{"id"},
       "name": name,
       "id" : child{"id"},
       "eci": channel{"id"}
      }
    }
/*
    updateChildCompletion = function(name){
      children_map = ent:wrangler_children.collect(function(child){
                                            (child.name == name) => "childToUpdate" | "otherChildren"
                                          });//separate the children, returns two arrays


      updated_child = children_map{"childToUpdate"}.head();
      updated_children = children_map{"otherChildren"}.append(updated_child);//reunite with the other children
      updated_children
    }
*/
    // optimize by taking a list of names, to prevent multiple network calls to channels when checking for unique name
    MAX_RAND_ENGL_NAMES = 200
    
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
// ***                                      System                                          ***
// ***                                                                                      ***
// ********************************************************************************************
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

  rule installRulesets {
    select when wrangler install_rulesets_requested
    pre {
      rids = event:attr("rids").defaultsTo(event:attr("rid")).defaultsTo("")
      rid_list = (rids.typeof() ==  "Array") => rids | rids.split(re#;#)
      valid_rids = rid_list.intersection(registeredRulesets())
      invalid_rids = rid_list.difference(valid_rids)
      initial_install = event:attr("init").defaultsTo(false) // if this is a new pico
    }
    if(rids !=  "") && valid_rids.length() > 0 then every{
      installRulesets(valid_rids) setting(rids)
      send_directive("rulesets installed", { "rids": rids{"rids"} });
    }
    fired {
      raise wrangler event "ruleset_added"
        attributes event:attrs.put(["rids"], rids{"rids"});
    }
    else {
      error info "could not install rids: no valid rids provided";
    }
    finally {
      raise wrangler event "install_rulesets_error"
        attributes event:attrs.put(["rids"],invalid_rids) if invalid_rids.length() > 0;
      raise wrangler event "finish_initialization"
        attributes event:attrs  if initial_install == true;
      
    }
  }

  rule uninstallRulesets {
    select when wrangler uninstall_rulesets_requested
    pre {
      rids = event:attr("rids").defaultsTo("")
      rid_list = rids.typeof() ==  "array" => rids | rids.split(re#;#)
    } every{
      uninstallRulesets(rid_list)
      send_directive("rulesets uninstalled", {"rids":rid_list});
    }
  }

// ********************************************************************************************
// ***                                      Channels                                        ***
// ********************************************************************************************

  rule createChannel {
    select when wrangler channel_creation_requested
    pre { channel_name = event:attr("name") }
    if(checkName(channel_name) && not channel_name.isnull() ) then every {
      createChannel(meta:picoId,
                    channel_name,
                    event:attr("type").defaultsTo("_wrangler"),
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

  rule deleteChannel {
    select when wrangler channel_deletion_requested
    every {
      deleteChannel( alwaysEci(event:attr("eci")
                     .defaultsTo(event:attr("name")
                     .defaultsTo("")))) setting(channel);
      send_directive("channel_deleted", channel);
    }
    always {
     raise wrangler event "channel_deleted" // API event
           attributes event:attrs.put(["channel"],channel)
         }
    }


// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
  //-------------------- Picos initializing  ----------------------
  rule createChild {
    select when wrangler child_creation or wrangler new_child_request
    pre {
      given_name = event:attr("name").defaultsTo("");
      name = given_name.length() == 0 => randomPicoName() | given_name;
      rids = event:attr("rids").defaultsTo([]);
      _rids = (rids.typeof() == "Array" => rids | rids.split(re#;#))

    }
    if(name) then every {
      createPico(name,_rids) setting(child)
      send_directive("Pico_Created", {"pico":child});
    }
    fired {
      ent:wrangler_children := {} if ent:wrangler_children.isnull(); // this is bypassed when module is used
      ent:wrangler_children{child{"id"}} := child; // this is bypassed when module is used
      ent:children := children();
      raise wrangler event "new_child_created"
        attributes child.put("rs_attrs",event:attrs);
      
    }
    else{
      raise wrangler event "child_creation_failure"
        attributes event:attrs
    }
  }

  rule createChild_failure {
    select when wrangler child_creation_failure
      send_directive("Pico_Not_Created", {});
    always {
      error info <<duplicate Pico name, failed to create pico named #{event:attr("name")}>>;
    }
  }

  rule initialize_child_after_creation {
    select when wrangler child_created
    pre {
      rids_to_install = event:attr("rids_to_install")
    }
    if rids_to_install.length() > 0 then
    noop()
    fired {
      raise wrangler event "install_rulesets_requested"
        attributes event:attrs.put(["rids"], rids_to_install).put("init", true)
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
    }
  }

  rule finish_child_initialization {
    select when wrangler finish_initialization
      event:send({ "eci"   : event:attr("parent_eci"),
                   "domain": "wrangler", "type": "child_initialized",
                   "attrs" : event:attrs })
    always {
      raise visual event "update"
        attributes event:attr("rs_attrs").put("dname",event:attr("name"))
    }
  }
  
  // this pico is the primary pico

  rule pico_root_created {
    select when wrangler root_created
    always {
      ent:id := event:attr("id");
      ent:eci := event:attr("eci");
      ent:wrangler_children := {};
      ent:children := {}
    }
  }

  rule pico_children_add_sync { // add hidden children to wrangler.
    select when wrangler child_sync or wrangler child_deletion
    foreach engine:listChildren() setting (pico_id,count)
    pre {
      new_child = (ent:wrangler_children{pico_id}.isnull()) =>
                    { "parent_eci":"",//placeholder // could create new channel, but then we would need to send event to child, but there is no guarantee of wrangler installed in that child....
                      "name": event:attr("id") == pico_id && event:attr("name")
                      => event:attr("name") | "rogue_"+randomPicoName() ,
                      "id": pico_id,
                      "eci": engine:listChannels(pico_id)[0]{"id"}} | "" ; // engine creates a eci we always can get.

    }
    if ( ent:wrangler_children{pico_id}.isnull()) then every{
      send_directive("new child found and added to cache",{"child": new_child});
    }
    fired {
      ent:wrangler_children{pico_id} := new_child;
      ent:children := children();
    }
  }

  rule pico_children_remove_sync_prep {
    select when wrangler child_sync or
                wrangler child_deletion or
                wrangler child_creation
    noop();
    always {
      raise wrangler event "remove_child_sync"
        attributes event:attrs.put(["engineList"],engine:listChildren())
                                .put(["wrangler_children"],ent:wrangler_children)
    }
  }

  rule pico_children_remove_sync {// remove dead children from wrangler. // does not work as intended, hard to test
    select when wrangler remove_child_sync
    foreach event:attr("wrangler_children") setting (child,id)
    pre {
      dead_child = event:attr("engineList").none(function(pico_id){pico_id == id}); // I dont think this should work !!!
    }
    if ( dead_child) then every{
      send_directive("dead child found and removed from cache",{"child": child});
    }
    fired {
      ent:wrangler_children := (ent:wrangler_children.delete(id));
      ent:children := ent:wrangler_children.values();//children();
    }
  }

  rule delete_child_check {
    select when wrangler child_deletion
    if hasChild( event:attr("name")
                 .defaultsTo(event:attr("id"))
                ).isnull() then every { noop();}
    fired{
     last;
    }
  }

  rule gatherDescendants {// this rule needs to be updated to use getters..
    select when wrangler child_deletion
    pre {
      value = event:attr("name").defaultsTo(event:attr("id"));
      filtered_children = ent:wrangler_children.filter(function(child,key){
                                              (child{"name"} ==  value || child{"id"} == value)
                                            });
      target_child = filtered_children.values()[0];
      subtreeArray = [target_child].append(gatherDescendants(target_child));
      updated_children = ent:wrangler_children.delete(target_child{"id"});
    }
    noop()
    fired{
      raise wrangler event "delete_children"
        attributes event:attrs.put(["subtreeArray"], subtreeArray.reverse())
                                .put(["updated_children"], updated_children)
    }
  }

  rule child_garbage_collection {
    select when wrangler delete_children
    foreach event:attr("subtreeArray") setting(child)
    every{
      send_directive("notifying child of intent to destroy", {"child": child});
      event:send({  "eci": child{"eci"}, "eid": 88,
                    "domain": "wrangler", "type": "garbage_collection",
                    "attrs": event:attrs });
    }
    always{
      schedule wrangler event "delete_child" at time:add(time:now(), {"seconds": 0.005})// ui needs children to be removed very fast(0.005 seconds), !!!this smells like poor coding practice...!!!
        attributes {"name"            :child{"name"},
                    "id"              :child{"id"}, "child_name":child{"name"},
                    "target"          :(event:attr("id") == child{"id"} || event:attr("name") == child{"name"} ),
                    "updated_children":event:attr("updated_children")}

    }
  }
  rule delete_child {
    select when wrangler delete_child
    pre { target = event:attr("target") }
    every{
      engine:removePico(event:attr("id"))
      deleteChannel(event:attr("child_name"))
    }
    always{
      ent:wrangler_children := event:attr("updated_children") if target;
      ent:children := children() if target;
      raise information event "child_deleted"
        attributes event:attrs;
    }
  }

}//end ruleset