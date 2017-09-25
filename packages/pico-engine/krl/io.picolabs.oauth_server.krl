ruleset io.picolabs.oauth_server {
  meta {
    shares __testing, clients
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "clients" } ],
                  "events": [ { "domain": "oauth", "type": "register",
                                "attrs": [ "client_id", "client_name", "redirect_uri", "client_uri","client_img","client_rids" ] },
                              { "domain": "oauth", "type": "authorize",
                                "attrs": [ "client_id", "redirect_uri" ] } ] }
    getClient = function(client_id) {
      ent:clients{client_id}
    }
    clients = function() {
      ent:clients
    }
  }
//
// handle route /register
//
  rule oauth_register_initialize {
    select when oauth register
    if not ent:clients then noop()
    fired {
      ent:clients := {}
    }
  }
  rule oauth_register_reminder {
    select when oauth register
    pre {
      client_id = event:attr("client_id")
      client = getClient(client_id)
    }
    if ent:clients >< client_id then
      send_directive("ok", {
        "client_id"    : client_id,
        "client_secret": client{"client_secret"},
        "client_img":  client{"client_img"}
      });
    fired { last }
  }
  rule oauth_register {
    select when oauth register
    pre {
      client_id     = event:attr("client_id")
      client_secret = client_id == "oauth-client-1" => "oauth-client-secret-1"
                                                     | random:uuid()
      client_name   = event:attr("client_name")
      redirect_uri  = event:attr("redirect_uri") // callback
      client_uri    = event:attr("client_uri") // about page
      client_img    = event:attr("client_img") // logo, url to image.
      client_rids   = event:attr("client_rids") // about page
      grant_type    = "authorization_code"
      scope         = ""
      new_client    = {
        "client_name":   client_name,
        "client_id":     client_id,
        "client_secret": client_secret,
        "client_uri":    client_uri,
        "redirect_uris": [ redirect_uri ],
        "client_img": client_img,
        "client_rids": client_rids
      }
      already_registered = ent:clients >< client_id
    }
    if not already_registered then
      send_directive("ok", {
        "client_id"    : client_id,
        "client_secret": client_secret,
        "client_img"   : client_img
      });
    fired {
      ent:clients{client_id} := new_client
    }
  }
//
// handle route /authorize
//
  rule oauth_authorize_initialize_requests {
    select when oauth authorize
    if not ent:requests then noop()
    fired {
      ent:requests := {}
    }
  }
  rule oauth_authorize_check_client_id {
    select when oauth authorize
    pre {
      client_id = event:attr("client_id")
      client = getClient(client_id)
    }
    if not client then
      send_directive("error", {"error_message": "Unknown client " + client_id})
    fired { last }
    else { ent:client := client }
  }
  rule oauth_authorize_check_redirect_uri {
    select when oauth authorize
    pre {
      redirect_uri = event:attr("redirect_uri")
    }
    if not (ent:client{"redirect_uris"} >< redirect_uri) then
      send_directive("error", {"error_message": "Invalid redirect URI"})
    fired { clear ent:client; last }
  }
  rule oauth_authorize_render_approve {
    select when oauth authorize
    pre {
      reqid     = random:uuid()
    }
    if true then
      send_directive("approve", {
        "client_id": ent:client{"client_id"},
        "client_name": ent:client{"client_name"},
        "client_img":  ent:client{"client_img"},
        "reqid": reqid
      });
    fired {
      ent:requests{reqid} := event:attrs();
      clear ent:client; last
    }
  }
//
// handle route /approve
//
  rule oauth_approve_initialize {
    select when oauth approve
    if not ent:codes then noop()
    fired { ent:codes := {} }
  }
  rule oauth_approve_check_query {
    select when oauth approve
    pre {
      reqid = event:attr("reqid")
      query = ent:requests{reqid}
    }
    if not query then
      send_directive("error", {"error": "No matching authorization request"})
    fired { last }
    else { ent:query := query }
    finally {
      ent:requests{reqid} := null
    }
  }
  rule oauth_approve_check_approval {
    select when oauth approve
    pre {
      approved = event:attr("approve") == "Approve"
    }
    if not approved then
      send_directive("respond", {
        "error": "access_denied",
        "redirect_uri": ent:query{"redirect_uri"}
      });
    fired { last; clear ent:query }
  }
  rule oauth_approve_check_response_type {
    select when oauth approve
    if ent:query{"response_type"} != "code" then
      send_directive("respond", {
        "error": "unsupported_response_type",
        "redirect_uri": ent:query{"redirect_uri"}
      })
    fired { last; clear ent:query }
  }
  rule oauth_approve_supply_code {
    select when oauth approve
    pre {
      code = random:uuid()
      owner_id = event:attr("owner_id")
    }
    send_directive("respond", {
      "code": code,
      "state": ent:query{"state"},
      "redirect_uri": ent:query{"redirect_uri"}
    })
    fired {
      ent:codes{code} := { "request": ent:query, "owner_id": owner_id };
      clear ent:query;
      last
    }
  }
//
// handle route /token
//
  rule oauth_token_check_client_id {
    select when oauth token
    pre {
      client_id = event:attr("client_id")
      client = getClient(client_id)
    }
    if not client then
      send_directive("error", {"statusCode": 401, "message": "invalid_client"})
    fired { last }
    else { ent:client := client }
  }
  rule oauth_token_check_client_secret {
    select when oauth token
    if ent:client{"client_secret"} != event:attr("client_secret") then
      send_directive("error", {"statusCode": 401, "message": "invalid_client"})
    fired { last; clear ent:client }
  }
  rule oauth_token_check_grant_type {
    select when oauth token
    if event:attr("grant_type") != "authorization_code" then
      send_directive("error", {"statusCode": 400, "message": "unsupported_grant_type"})
    fired { last; clear ent:client }
  }
  rule oauth_token_check_code {
    select when oauth token
    pre {
      code = ent:codes{event:attr("code")}
    }
    if not code then
      send_directive("error", {"statusCode": 400, "message": "invalid_grant"})
    fired { last; clear ent:client }
    else { ent:code := code}
    finally { ent:codes{event:attr("code")} := null }
  }
  rule oauth_token_check_code_client_id {
    select when oauth token
    if ent:code{["request","client_id"]} != ent:client{"client_id"} then
      send_directive("error", {"statusCode": 400, "message": "invalid_grant"})
    fired { last; clear ent:code; clear ent:client }
  }
  rule oauth_token_access_token {
    select when oauth token
    pre {
      client_id = ent:client{"client_id"}
      client_rids = (ent:client{"client_rids"}).split(re#;#)
      owner_id = ent:code{"owner_id"}.klog("owner_id in oauth_token_access_token");
    }
    every {
      engine:newChannel(owner_id, client_id, "oauth") setting(new_channel) //HEY !!!!! TODO this should use wrangler and not engine!!!
      engine:installRuleset(owner_id,client_rids)
      event:send(
        { "eci": new_channel{"id"},
          "domain": "wrangler", "type": "ruleset_added",
          "attrs": ({
           "rids": client_rids
          })
      });
      send_directive("ok", {"access_token": new_channel{"id"}, "token_type": "Bearer"})
    }
    fired {
      last; clear ent:code; clear ent:client
    }
  }
}
