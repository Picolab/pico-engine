ruleset io.picolabs.oauth_server {
  meta {
    shares __testing, clients
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "clients" } ],
                  "events": [ { "domain": "oauth", "type": "register",
                                "attrs": [ "client_id", "client_name", "redirect_uri", "client_uri" ] },
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
    }
    if ent:clients >< client_id then
      send_directive("ok") with
        client_id     = client_id
        client_secret = getClient(client_id){"client_secret"}
    fired { last }
  }
  rule oauth_register {
    select when oauth register
    pre {
      client_id     = event:attr("client_id")
      client_secret = client_id == "oauth-client-1" => "oauth-client-secret-1"
                                                     | uuid.uuid()
      client_name   = event:attr("client_name")
      redirect_uri  = event:attr("redirect_uri")
      client_uri    = event:attr("client_uri")
      grant_type    = "authorization_code"
      scope         = ""
      new_client    = {
        "client_name":   client_name,
        "client_id":     client_id,
        "client_secret": client_secret,
        "client_uri":    client_uri,
        "redirect_uris": [ redirect_uri ]
      }
      already_registered = ent:clients >< client_id
    }
    if not already_registered then
      send_directive("ok") with
        client_id     = client_id
        client_secret = client_secret
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
      send_directive("error") with error_message = "Unknown client " + client_id
    fired { last }
    else { ent:client := client }
  }
  rule oauth_authorize_check_redirect_uri {
    select when oauth authorize
    pre {
      redirect_uri = event:attr("redirect_uri")
    }
    if not (ent:client{"redirect_uris"} >< redirect_uri) then
      send_directive("error") with error_message = "Invalid redirect URI"
    fired { ent:client := null; last }
  }   
  rule oauth_authorize_render_approve {
    select when oauth authorize
    pre {
      reqid = uuid.uuid()
    }
    if true then
      send_directive("approve") with
        client_id = ent:client{"client_id"}
        client_name = ent:client{"client_name"}
        reqid = reqid
    fired {
      ent:requests{reqid} := event:attrs();
      ent:client := null; last
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
      send_directive("error") with error = "No matching authorization request"
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
      send_directive("respond") with
        error = "access_denied"
        redirect_uri = ent:query{"redirect_uri"}
    fired { last; ent:query := null }
  }
  rule oauth_approve_check_response_type {
    select when oauth approve
    if ent:query{"response_type"} != "code" then
      send_directive("respond") with
        error = "unsupported_response_type"
        redirect_uri = ent:query{"redirect_uri"}
    fired { last; ent:query := null }
  }
  rule oauth_approve_supply_code {
    select when oauth approve
    pre { code = uuid.uuid() }
    send_directive("respond") with
      code = code
      state = ent:query{"state"}
      redirect_uri = ent:query{"redirect_uri"}
    fired {
      ent:codes{code} := { "request": ent:query };
      ent:query := null;
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
      send_directive("error") with statusCode = 401 message = "invalid_client"
    fired { last }
    else { ent:client := client }
  }
  rule oauth_token_check_client_secret {
    select when oauth token
    if ent:client{"client_secret"} != event:attr("client_secret") then
      send_directive("error") with statusCode = 401 message = "invalid_client"
    fired { last; ent:client := null }
  }
  rule oauth_token_check_grant_type {
    select when oauth token
    if event:attr("grant_type") != "authorization_code" then
      send_directive("error") with statusCode = 400 message = "unsupported_grant_type"
    fired { last; ent:client := null }
  }
  rule oauth_token_check_code {
    select when oauth token
    pre {
      code = ent:codes{event:attr("code")}
    }
    if not code then
      send_directive("error") with statusCode = 400 message = "invalid_grant"
    fired { last; ent:client := null }
    else { ent:code := code}
    finally { ent:codes{event:attr("code")} := null }
  }
  rule oauth_token_check_code_client_id {
    select when oauth token
    if ent:code{["request","client_id"]} != ent:client{"client_id"} then
      send_directive("error") with statusCode = 400 message = "invalid_grant"
    fired { last; ent:code := null; ent:client := null }
  }
  rule oauth_token_access_token {
    select when oauth token
    pre {
      access_token = meta:eci
    }
    send_directive("ok") with access_token = access_token token_type = "Bearer"
    fired { last; ent:code := null; ent:client := null }
  }
}
