// operators are camel case, variables are snake case.

ruleset io.picolabs.pico {
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
    channel, alwaysEci, eciFromName, nameFromEci,//channel
    children, parent_eci, name, profile, pico, uniquePicoName, randomPicoName, createPico, deleteChild, pico, myself
    shares skyQuery ,
    rulesetsInfo,installedRulesets,  installRulesets, uninstallRulesets,registeredRulesets, //ruleset
    channel, alwaysEci, eciFromName, nameFromEci,//channel
    children, parent_eci, name, profile, pico, uniquePicoName, randomPicoName, createPico, deleteChild, pico,  myself,
     __testing
  }
  global {
    __testing = { "queries": [  { "name": "channel", "args":["value","collection","filtered"] },
                                {"name":"skyQuery" , "args":["eci", "mod", "func", "params","_host","_path","_root_url"]},
                                {"name":"children" , "args":[]} ],
                  "events": [ { "domain": "wrangler", "type": "child_creation",
                                "attrs": [ "name" ] },
                              { "domain": "wrangler", "type": "child_deletion",
                                "attrs": [ "pico_name" ] },
                              { "domain": "wrangler", "type": "channel_creation_requested",
                                "attrs": [ "channel_name", "channel_type" ] },
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

  config= {"os_rids": [/*"io.picolabs.pds",*/"io.picolabs.pico","io.picolabs.visual_params"]}
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

    //returns a list of children that are contained in a given subtree at the starting child. No ordering is guaranteed in the result
    gatherDescendants = function(child){
      moreChildren = skyQuery(child{"eci"}, "io.picolabs.pico", "children"){"children"}.klog("Sky query result: ");
      //final_pico_array = [child].append(moreChildren).klog("appendedResult");

      gatherChildrensChildren = function(moreChildren){
        arrayOfChildrenArrays = moreChildren.map(function(x){ gatherDescendants(x.klog("moreChildren child: ")) }).klog("More,moreChildren child: ");
        arrayOfChildrenArrays.reduce(function(a,b){ a.append(b) });
      };

      result = (moreChildren.length() == 0) => [] | moreChildren.append(gatherChildrensChildren(moreChildren));
      result
    }

    picoFromName = function(value){
      return = children(){"children"}.defaultsTo([]).filter(function(child){
                                              (child{"name"} ==  value || child{"id"} == value)});
      return.head().defaultsTo("Error")//no pico exists for given name
    }

    deleteChild = defaction(pico_name){
      ent_children = children(){"children"}
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

    hasChild = function(value){ // helper function, does not need return object.
      ent_children = children(){"children"};
      target_child = ent_children.filter(function(child){
                                            child{"name"} ==  value || child{"id"} == value
                                          }).head().defaultsTo({});
      target_child
    }
// ********************************************************************************************
// ***                                      Rulesets                                        ***
// ********************************************************************************************
    registeredRulesets = function() {
      eci = meta:eci;
      rids = engine:listAllEnabledRIDs();
      {
        "rids"     : rids
      }.klog("registeredRulesets :")
    }

    rulesetsInfo = function(rids) {
      _rids = ( rids.typeof() == "Array" ) => rids | ( rids.typeof() == "String" ) => rids.split(";") | "" ;
      results = _rids.map(function(rid) {engine:describeRuleset(rid);});
      {
       "description"     : results
      }.klog("rulesetsInfo :")
    }

    installedRulesets = function() {
      eci = meta:eci;
      rids = engine:listInstalledRIDs();
      {
        "rids"     : rids
      }.klog("installedRulesets :")
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
      chan = channel(name, null, null){"channels"}.defaultsTo(null,"no channel found");
      chan.isnull();
    }

    nameFromEci = function(eci){ // internal function call
      channel = channel(eci,null,null){"channels"};
      channel{"name"}
    }
    eciFromName = function(name){
      channel = channel(name,null,null){"channels"};
      channel{"id"}
    }

    alwaysEci = function(value){   // always return a eci wether given a eci or name
      channels = engine:listChannels(meta:picoId);
      channel = channels.filter(function(chan){chan{"id"} == value || chan{"name"} == value}).head().defaultsTo({},"no channel found in alwayseci, by .head()");
      channel{"id"}
    }

    channel = function(value,collection,filtered) {
      channels = engine:listChannels(meta:picoId.klog("channel picoId"),meta:eci.klog("channel eci"));

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
      results = (value.isnull()) => return2 | single_channel(channels);
      {
        "channels" : results
      }.klog("channels: ")
    }

    deleteChannel = defaction(value) {
        channel = channel(value,null,null){"channels"}
        eci = channel{"id"}
        engine:removeChannel(eci)
        returns channel
    }

    createChannel = defaction(id , name, type) {
      every{
        engine:newChannel(id , name, type) setting(channel);
      }
      returns  channel
    }
// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
  myself = function(){
      { "id": ent:id, "eci": ent:eci, "name": ent:name }
  }

  children = function(name) {
    _children = ent:wrangler_children.defaultsTo({});
    _return = name => _children.filter(function(child){child{"name"} == name}) | _children;
    {
      "children" : _return.values()
    }.klog("children :")
  }

  parent_eci = function() {
    _parent = ent:parent_eci.defaultsTo("");
    {
      "parent" :  _parent
    }.klog("parent :")
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
    }.klog("pico :")
  }

  name = function() {
    return = ent:name;
    {
      "picoName" : return
    }.klog("name :")
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
        engine:installRuleset(child{"id"},rids.append(config{"os_rids"}));// install child OS
        event:send( // intoroduce child to itself and parent
          { "eci": channel{"id"},
            "domain": "wrangler", "type": "child_created",
            "attrs": ({
              "parent_eci": parent_channel{"id"},
             "name": name,
             "id" : child{"id"},
             "eci": channel{"id"},
             "rids": rids,
             "rs_attrs":event:attrs()
            })
            });
        event:send( // tell child that a ruleset was added
          { "eci": channel{"id"},
            "domain": "wrangler", "type": "ruleset_added",
            "attrs": ({
             "rids": rids,
             "rs_attrs":event:attrs()
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

    randomPicoName = function(){
        n = 5;
        array = (0).range(n).map(function(n){
          (random:word())
          });
        names= array.collect(function(name){
          (uniquePicoName( name )) => "unique" | "taken"
        });
        name = names{"unique"} || [];

        unique_name =  name.head().defaultsTo("","unique name failed");
        (unique_name).klog("randomPicoName : ")
    }

    //returns true if given name is unique
    uniquePicoName = function(name){
          picos = children(){"children"};
          names = picos.none(function(child){
            (child{"name"} ==  name)
            });
          (names).klog("uniquePicoName : ")

    }
  }
// ********************************************************************************************
// ***                                                                                      ***
// ***                                      Rulesets                                        ***
// ***                                                                                      ***
// ********************************************************************************************

  rule installRulesets {
    select when wrangler install_rulesets_requested or pico new_ruleset or pico install_rulesets_requested
    pre {
      rids = event:attr("rids").defaultsTo(event:attr("rid")).defaultsTo("")
      rid_list = (rids.typeof() ==  "Array") => rids | rids.split(re#;#)
      b = rid_list.klog("attr Rids")
    }
    if(rids !=  "") then every{ // should we be valid checking?
      installRulesets(rid_list) setting(rids)
      send_directive("rulesets installed", {"rids":rids.rids}); // should we return rids or rid_list?
    }
    fired {
      raise wrangler event "ruleset_added"
        attributes event:attrs().put({"rids": rid_list});
      raise pico event "ruleset_added" attributes event:attrs();
      rids.klog("successfully installed rids ");
    }
    else {
      error info "could not install rids, no rids attribute provide.";
    }
  }

  rule uninstallRulesets { // should this handle multiple uninstalls ???
    select when wrangler uninstall_rulesets_requested or pico uninstall_rulesets_requested
    pre {
      rids = event:attr("rids").defaultsTo("", ">>  >> ")
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
    select when wrangler channel_creation_requested or pico channel_creation_requested
    pre {
      channel_name = event:attr("name").defaultsTo("", "missing event attr channels")
      type = event:attr("type").defaultsTo("Unknown", "missing event attr channel_type")
      check_name = checkName(channel_name);
    }
    if(check_name && channel_name.length() != 0 ) then every {
      createChannel(meta:picoId, channel_name , type) setting(channel);
      send_directive("channel_Created", {"channel":channel});
    }
    always {
      channel_name.klog("successfully created channel ");
      raise wrangler event "channel_created" // event to nothing
            attributes event:attrs().put(["channel"], channel);

      error info <<could not create channels #{channel_name}, duplicate name.>> if not check_name
    }
  }

  rule deleteChannel {
    select when wrangler channel_deletion_requested or pico channel_deletion_requested
    pre {
      value = event:attr("eci").defaultsTo(event:attr("name").defaultsTo("", "missing event attr eci or name"), "looking for name instead of eci.")
      channel = alwaysEci(value);
    }
    every {
      deleteChannel(value) setting(channel);
      send_directive("channel_deleted", {"channel":channel});
    }
    fired {
     value.klog ("successfully deleted channel ");
     raise wrangler event "channel_deleted" // event to nothing
           attributes event:attrs().put(["channel"],channel)
         }
    }


// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
  //-------------------- Picos initializing  ----------------------
  rule createChild {
    select when wrangler child_creation or wrangler new_child_request or pico new_child_request
    pre {
      check = event:attr("name").defaultsTo(event:attr("dname").defaultsTo(""));
      name = check.length() == 0 => randomPicoName() | check;
      uniqueName = uniquePicoName(name).klog("uniqueName ");
      rids = event:attr("rids").defaultsTo([]);
      _rids = (rids.typeof() == "Array" => rids | rids.split(re#;#))
    }
    if(uniqueName) then every {
      createPico(name,_rids) setting(child)
      send_directive("Pico_Created", {"pico":child});
    }
    fired {
      ent:wrangler_children := {} if ent:wrangler_children.isnull(); // this is bypassed when module is used
      ent:wrangler_children{child{"id"}} := child; // this is bypassed when module is used
      ent:children := children(){"children"};
      child.klog("successfully created child ");
    }
    else{
      raise wrangler event "child_creation_falure"
        attributes event:attrs()
    }
  }

  rule createChild_failure {
    select when wrangler child_creation_falure
      send_directive("Pico_Not_Created", {});
    always {
      error info <<duplicate Pico name, failed to create pico named #{event:attr("name")}>>;
      event:attr("name").klog(" duplicate Pico name, failed to create pico named ");
    }
  }

  rule child_created {
    select when wrangler child_created or pico child_created
    pre {
      parent_eci    = event:attr("parent_eci")
      name          = event:attr("name")
      id            = event:attr("id")
      eci           = event:attr("eci")
      rs_attrs      = event:attr("rs_attrs")
    }
    if true
    then
      event:send(
        { "eci": parent_eci,
          "domain": "wrangler", "type": "child_initialized",
          "attrs": event:attrs() })
    fired {
      ent:parent_eci := parent_eci;
      ent:name := name;
      ent:id := id;
      ent:eci := eci;
      raise visual event "update"
        attributes rs_attrs.put("dname",name)
    }
  }
  // this pico is the primary pico

  rule pico_root_created {
    select when wrangler root_created or pico root_created
    pre {
      id = event:attr("id")
      eci = event:attr("eci")
    }
    always {
      ent:id := id;
      ent:eci := eci;
      ent:wrangler_children := {};
      ent:children := {}
    }
  }

  rule pico_children_add_sync { // add hidden children to wrangler.
    select when wrangler child_sync or
                pico need_sync or
                wrangler child_deletion or 
                pico delete_child_request_by_pico_id or
                pico delete_child_request

    foreach engine:listChildren() setting (pico_id,count)
    pre {
      new_child = (ent:wrangler_children{pico_id}.isnull()) =>
                    { "parent_eci":"",//placeholder // could create new channel, but then we would need to send event to child, but there is no guarantee of wrangler installed in that child....
                      "name": event:attr("id") == pico_id &&
                              event:attr("name") => event:attr("name") | 
                                                    "rogue_"+randomPicoName() ,
                      "id": pico_id,
                      "eci": engine:listChannels(pico_id)[0]{"id"}} | "" ; // engine creates a eci we always can get.

    }
    if ( ent:wrangler_children{pico_id}.isnull()) then every{
      send_directive("new child found and added to cache",{"child": new_child});
    }
    fired {
      ent:wrangler_children{pico_id} := new_child;
      ent:children := children(){"children"};
    }
  }

  rule pico_children_remove_sync_prep {
    select when wrangler child_sync or
                pico need_sync or
                wrangler child_deletion or 
                pico delete_child_request_by_pico_id or
                pico delete_child_request
    noop();
    always {
      raise wrangler event "remove_child_sync"
        attributes event:attrs().put(["engineList"],engine:listChildren())
                                .put(["wrangler_children"],ent:wrangler_children)
    }
  }
  
  rule pico_children_remove_sync {// remove dead children from wrangler. // does not work as intended, hard to test
    select when wrangler remove_child_sync
    foreach event:attr("wrangler_children") setting (child,id)
    pre {
      dead_child = event:attr("engineList").none(function(pico_id){pico_id == id}); // if child is not in engineList
    }
    if ( dead_child) then every{
      send_directive("dead child found and removed from cache",{"child": child});
    }
    fired {
      ent:wrangler_children := (ent:wrangler_children.delete(id.klog("pico_idXKCD in remove_sync")));
      ent:children := ent:wrangler_children.values();//children(){"children"}.klog("pico_idXKCD3 in remove_sync");
    }
  }

  rule delete_child_check {
    select when wrangler child_deletion or
                pico delete_child_request_by_pico_id or
                pico delete_child_request
    pre {
      value = event:attr("name").defaultsTo(event:attr("id"), "used id for deletion");
      child = hasChild(value);
    }
    if child.isnull() then every {
      noop();
    }
    fired{
     last;
    }
  }

  rule gatherDescendants {
    select when wrangler child_deletion or 
                pico delete_child_request_by_pico_id or
                pico delete_child_request
    pre {
      value = event:attr("name").defaultsTo(event:attr("id"),"id used to delete child");
      filtered_children = ent:wrangler_children.filter(function(child,key){
                                              (child{"name"} ==  value || child{"id"} == value)
                                            }).klog("filtered_children result: ");
      target_child = filtered_children.values()[0];
      subtreeArray = [target_child].append(gatherDescendants(target_child)).klog("Subtree result: ");
      updated_children = ent:wrangler_children.delete(target_child{"id"});
    }
    noop()
    fired{
      raise wrangler event "delete_children"
        attributes event:attrs().put(["subtreeArray"], subtreeArray.reverse())
                                .put(["updated_children"], updated_children)
    }
  }

  rule pico_intent_to_orphan {
    select when wrangler delete_children
    foreach event:attr("subtreeArray") setting(child)
    pre{
        a = child.klog("child");
        a = event:attr("subtreeArray").klog("subtreeArray");
      }
    every{
      send_directive("notifying child of intent to kill", {"child": child});
      event:send({  "eci": child{"eci"}, "eid": 88,
                    "domain": "pico", "type": "intent_to_orphan",
                    "attrs": event:attrs() });
    }
    always{
      schedule wrangler event "delete_child" at time:add(time:now(), {"seconds": 0.1})// ui needs children to be removed very fast(0.1 seconds). 
        attributes {"name":child{"name"},
                    "id":child{"id"},
                    "target": (event:attr("id") == child{"id"}),
                    "updated_children":event:attr("updated_children")}

    }
  }

  rule delete_child {
    select when wrangler delete_child
    pre {
      updated_children = event:attr("updated_children");
      target = event:attr("target");
      id = event:attr("id");
      a = event:attrs().klog("attrs in delete child");
    }
      engine:removePico(id)
    always{
      ent:wrangler_children := event:attr("updated_children").klog("updated_children: ") if target;
      ent:children := children(){"children"};
      raise information event "child_deleted"
        attributes event:attrs();
    }
  }

}//end ruleset
