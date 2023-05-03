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
      This Ruleset/Module provides a developer interface to the pico (persistent compute object).
      When a pico is created this ruleset will be installed to provide essential services.
    >>
    author "BYU Pico Lab"

    provides skyQuery, picoQuery,
    channels, createChannel, deleteChannel, //channel
    rulesetConfig, rulesetMeta, installedRIDs, //ruleset
    children, parent_eci, name, myself //pico

    shares skyQuery, picoQuery,
    channels, //channel
    rulesetConfig, rulesetMeta,installedRIDs, //ruleset
    children, parent_eci, name, myself, id //pico
  }
  global {
    __testing = { "queries": [  {"name": "name"},
                                {"name": "myself"},
                                { "name": "channels", "args":["tags"] },
                                { "name": "installedRIDs"},
                                {"name":"skyQuery", "args":["eci", "mod", "func", "params","_host","_path","_root_url"]},
                                {"name":"children", "args":[]}
                                ],
                  "events": [
                              { "domain": "wrangler", "name": "new_child_request",
                                "attrs": [ "name", "backgroundColor"] },
                              { "domain": "wrangler", "name": "child_deletion_request",
                              "attrs": [ "eci"] },
                              { "domain": "wrangler", "name": "new_channel_request",
                                "attrs": [ "tags", "eventPolicy", "queryPolicy" ] },
                              { "domain": "wrangler", "name": "channel_deletion_request",
                                "attrs": [ "eci" ] },
                              { "domain": "wrangler", "name": "install_ruleset_request",
                                "attrs": [ "url" ] },
                              { "domain": "wrangler", "name": "install_ruleset_request",
                                "attrs": [ "absoluteURL","rid" ] },
                              { "domain": "wrangler", "name": "uninstall_ruleset_request",
                                "attrs": [ "rid" ] },
                            ] }
                                
                                
// ********************************************************************************************
// ***                                                                                      ***
// ***                                      FUNCTIONS                                       ***
// ***                                                                                      ***
// ********************************************************************************************

  /*
       picoQuery is used to programmatically call function inside of other picos from inside a rule.
       parameters;
          eci - The eci of the pico which contains the function to be called
          mod - The ruleset ID or alias of the module
          func - The name of the function in the module
          params - The parameters to be passed to function being called
          optional parameters
          _host - The host of the pico-engine being queried.
                  Note this must include protocol (http:// or https://) being used and port number if not 80.
                  For example "http://localhost:8080", which also is the default.
          _path - The sub path of the url which does not include mod or func.
                  For example "/sky/cloud/", which also is the default.
          _root_url - The entire url except eci, mod, func.
                  For example, dependent on _host and _path is
                  "http://localhost:8080/sky/cloud/", which also is the default.
       picoQuery on success (if status code of request is 200) returns results of the called function.
       picoQuery on failure (if status code of request is not 200) returns a Map of error information which contains;
               error - general error message.
               httpStatus - status code returned from http get command.
               picoQueryError - The value of the "error key", if it exist, aof the function results.
               picoQueryErrorMsg - The value of the "error_str", if it exist, of the function results.
               picoQueryReturnValue - The function call results.
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
       error = error_info.put({"picoQueryError": response_error,
                               "picoQueryErrorMsg": response_error_str,
                               "picoQueryReturnValue": response_content});
       is_bad_response = (response_content.isnull() || (response_content == "null") || response_error || response_error_str);
       // if HTTP status was OK & the response was not null and there were no errors...
       (status == 200 && not is_bad_response) => response_content | error.klog("error: ")
     }
     
     skyQuery = function(eci, mod, func, params,_host,_path,_root_url) { // path must start with "/"", _host must include protocol(http:// or https://)
       //.../sky/cloud/<eci>/<rid>/<name>?name0=value0&...&namen=valuen
       thisPico = ctx:channels.any(function(c){c{"id"}==eci})
       web_hook = buildWebHook(eci, mod, func, _host, _path, _root_url)

       response = (not thisPico) => http:get(web_hook, {}.put(params)) | QUERY_SELF_INVALID_HTTP_MAP;
       processHTTPResponse(response)
     }

/*
  picoQuery() is an improved skyQuery() that automatically queries picos on the same engine using ctx:query() to avoid
  unnecessary HTTP calls and channel policy issues (family channels can't be accessed over HTTP).

  The parameters are the same.
*/

     // this does nothing now, but it may be that we need to return error codes. 
     processQueryResponse = function(response) {
       response
     }
     
     picoQuery = function(eci, mod, func, params,_host,_path,_root_url) { 
       thisPico = ctx:channels.any(function(c){c{"id"}==eci})
       thisHost = _host.isnull() || _host == meta:host;
       web_hook = buildWebHook(eci, mod, func, _host, _path, _root_url)

       response = (not thisPico) => ((not thisHost) => processHTTPResponse(http:get(web_hook, {}.put(params))) 
                                                     | processQueryResponse(ctx:query(eci, mod, func, {}.put(params))))
                                  | QUERY_SELF_INVALID_HTTP_MAP;

       response
     }


    
// ********************************************************************************************
// ***                                      Rulesets                                        ***
// ********************************************************************************************

    rulesetByRID = function(rid) {
      ctx:rulesets.filter(function(rs){rs{"rid"}==rid}).head()
    }

    rulesetConfig = function(rid) {
      rulesetByRID(rid){"config"}
    }

    rulesetMeta = function(rid) {
      rulesetByRID(rid){["meta","krlMeta"]}
    }

    installedRIDs = function() {
      ctx:rulesets.map(function(rs){rs{"rid"}})
    }

// ********************************************************************************************
// ***                                      Channels                                        ***
// ********************************************************************************************

    channels = function(tags){
      all_channels = ctx:channels
      str_tags = tags.typeof()=="Array" => tags.join(",") | tags
      cf_tags = tags => str_tags.lc().split(",").sort().join(",") | null
      cf_tags.isnull() => all_channels
        | all_channels.filter(function(c){c{"tags"}.sort().join(",")==cf_tags})
    }

    deleteChannel = defaction(eci) {
      ctx:delChannel(eci)
    }

    createChannel = defaction(tags,eventPolicy,queryPolicy){
      ctx:newChannel(
        tags=tags,
        eventPolicy=eventPolicy,
        queryPolicy=queryPolicy
      ) setting(channel)
      return channel
    }

// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************

    myself = function(){
      {
        "name":ent:name,
        "id":ent:id,
        "eci":ent:eci
      }
    }
    
    children = function() {
      convert = function(eci){
        pico = {}
          .put("eci",eci)
          .put("name",ctx:query(eci,ctx:rid,"name"))
          .put("parent_eci",ctx:query(eci,ctx:rid,"parent_eci"))
        pico
      }
      wrangler_children = ctx:children
        .map(convert)
      wrangler_children
    }
    
    parent_eci = function() {
      ent:parent_eci
    }
  
    name = function() {
      ent:name
    }
  
    id = function() {
      meta:picoId
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
      raise wrangler event "install_ruleset_request" attributes
        event:attrs
          .delete("absoluteURL") // so this rule won't select again!
          .put({"url":url})
    }
  }

  //installs io.picolabs.susbcription in every 
  rule install_ruleset_absolutely {
    select when wrangler install_ruleset_request
      url re#(.+)#           // required
      setting(url)
    pre {
      config = event:attr("config") || {}
    }
    every {
      ctx:flush(url=url)
      ctx:install(url=url, config=config) setting(rid)
    }
    fired {
      raise wrangler event "ruleset_installed" attributes
        event:attrs.put({"rids": [rid]})
    }
  }

  rule uninstall_one_ruleset {
    select when wrangler uninstall_ruleset_request
      rid re#(.+)# setting(rid)
    ctx:uninstall(rid)
    fired {
      raise wrangler event "ruleset_uninstalled" attributes event:attrs
    }
  }

  rule flush_all_rulesets {
    select when wrangler rulesets_need_flushing
    foreach ctx:rulesets setting(rs)
      ctx:flush(rs{"url"})
      fired {
        raise wrangler event "rulesets_flushed" on final
      }
  }

// ********************************************************************************************
// ***                                      Channels                                        ***
// ********************************************************************************************

  rule createChannel {
    select when wrangler new_channel_request
    pre {
      tags = event:attrs{"tags"}
      eventPolicy = event:attrs{"eventPolicy"}
      queryPolicy = event:attrs{"queryPolicy"}
    }
    if tags && eventPolicy && queryPolicy then
      createChannel(tags,eventPolicy,queryPolicy) setting(channel)
    fired {
      raise wrangler event "channel_created"
        attributes event:attrs.put({"channel":channel})
    }
  }

  rule deleteChannel {
    select when wrangler channel_deletion_request
      eci re#^(.+)$# // required
      setting(eci)
    deleteChannel(eci)
    fired {
      raise wrangler event "channel_deleted" attributes event:attrs
    }
  }

// ********************************************************************************************
// ***                                      Picos                                           ***
// ********************************************************************************************
  //-------------------- Picos initializing  ----------------------

  rule createChild {
    select when wrangler new_child_request
      name re#.+#             // required
      backgroundColor re#.*#  // optional
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
    }
    every {
      ctx:newPico(rulesets=[
        engine_ui_ruleset(),
        { "url": ctx:rid_url, "config": {} }
      ]) setting(newEci)
      ctx:eventQuery(
        eci=newEci,
        domain="engine_ui",
        name="setup",
        rid=engine_ui_rid,
        queryName="uiECI"
      ) setting(newUiECI)
      ctx:event(
        eci=newEci,
        domain="wrangler",
        name="pico_created",
        attrs=event:attrs
      )
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
    }
  }

//
// NOTE: the next two rules run in a newly created child pico
//
  rule initialize_child_after_creation {
    select when wrangler pico_created
    pre {
      subscription_ruleset_url = function(){
        subscription_rid = "io.picolabs.subscription"
        parts = ctx:rid_url.split("/")
        parts.splice(parts.length()-1,1,subscription_rid+".krl").join("/")
      }
      subs_url = subscription_ruleset_url()      
      
      did_o_ruleset_url = function(){
        did_o_rid = "io.picolabs.did-o"
        parts = ctx:rid_url.split("/")
        parts.splice(parts.length()-1,1,did_o_rid+".krl").join("/")
      }
      did_o_url = did_o_ruleset_url()
    }
    fired {
      raise wrangler event "install_ruleset_request"
        attributes {"url":subs_url}
      raise wrangler event "install_ruleset_request"
        attributes {"url":did_o_url}
      ent:parent_eci := ctx:parent
      ent:name := event:attr("name")
      ent:id := ctx:picoId
      ent:eci := event:eci
      //sends the parent pico the wrangler:child_initialized event
      raise wrangler event "pico_initialized"
        attributes event:attrs.put("eci",event:eci)
    }
  }

  
  rule finish_child_initialization {
    select when wrangler pico_initialized
      event:send({ "eci"   : ent:parent_eci,
                   "domain": "wrangler", "type": "child_initialized",
                   "attrs" : event:attrs })
  }
  
  // this pico is the primary pico

  rule pico_root_created {
    select when engine_ui setup
    if ent:id.isnull() && ent:parent_eci.isnull() then noop()
    fired {
      ent:id := ctx:picoId
      ent:eci := channels("system,self").head(){"id"}
      ent:name := "Pico"
    }
  }
    
  rule take_note_of_name_change {
    select when wrangler name_changed
      name re#(.+)# // required
      setting(name)
    fired {
      ent:name := name
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

    //-------------------- CHILD PERSPECTIVE  ----------------------

  rule child_initiates_deletion {
    select when wrangler ready_for_deletion
    pre {
      my_eci = channels("system,child").head().get("id")
    }
    if my_eci then
      event:send({"eci":ent:parent_eci,
        "domain":"wrangler", "type":"child_deletion_request",
        "attrs":{"eci":my_eci}})
  }

}//end ruleset
