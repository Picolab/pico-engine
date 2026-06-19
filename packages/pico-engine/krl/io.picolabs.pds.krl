ruleset io.picolabs.pds {
  meta {
    name "PDS"
    description <<
      Pico Data Services (PDS), a common data base structure for all rulesets to use.
    >>
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    logging on

    provides items, get_keys,
     profile,
     settings, get_config_value, get_setting_data_value, config_value, settings_names,
     getChannelEci

    shares items, get_keys,
     profile,
     settings, get_config_value, get_setting_data_value, config_value, settings_names,
     getChannelEci

  }


    // --------------------------------------------
    // PDS entity variables (io.picolabs.pds RS scope only)
    //
    // ent:profile — this pico's display identity
    //   {
    //     "name": "",
    //     "description": "",
    //     "photo": "<url or data: URI>",
    //     "_created": "20260609T120000+0000",   // set on first update
    //     "_modified": "20260609T153000+0000",  // set on every update
    //     "email": "",                          // optional
    //     "phone": ""                           // optional
    //   }
    //
    // ent:general — namespaced app/domain data
    //   "<namespace>": {
    //     "<key>": <value>,
    //     ...
    //   }
    //   Path: ent:general{[namespace, key]} or ent:general{namespace} for whole namespace map
    //
    // ent:settings — per-ruleset configuration, keyed by RID
    //   "<rulesetRID>": {
    //     "name": "<display name>",
    //     "rid": "<rulesetRID>",
    //     "data": { "<configKey>": <value>, ... },
    //     "schema": []
    //   }
    //   Path: ent:settings{[rulesetRID, "data", configKey]} for config_value()
    //
    // --------------------------------------------


  global {

    // Default avatar: embedded SVG (no external URL dependency)
    defaultUnknownPhoto = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWNlZmYxIi8+PGNpcmNsZSBjeD0iMzIiIGN5PSIyMiIgcj0iMTEiIGZpbGw9IiM3ODkwOWMiLz48ZWxsaXBzZSBjeD0iMzIiIGN5PSI1NCIgcng9IjE4IiByeT0iMTQiIGZpbGw9IiM3ODkwOWMiLz48L3N2Zz4="

    items = function (namespace, key){
      item = function(namespace, keyvalue) {
        ent:general{[namespace, keyvalue]}
      };

      multipleItems = function(namespace) {
        ent:general{namespace}
      };
      payload = (key.isnull()) => (namespace.isnull() => ent:general | multipleItems(namespace)) | item(namespace, key);
      status = namespace.isnull() => "failed" | "success";
      {
       "status"   : status,
        "general" : payload
      };
    }

    get_keys = function(namespace) {
      ent:general{namespace}.keys()
    }

    profile = function(key){
        get_profile = function(k) {
          ent:profile{k};
        };
        get_all_profile = function() {
          ent:profile;
        };
        payload = (key.isnull()) => get_all_profile() | get_profile(key);
        {
       "status"   : "success",
        "profile" : payload
        };
    };

    settings_names = function() {
      ent:settings.keys().map(function(setRID) {
        setName = ent:settings{[setRID, "name"]};
        {
          "setRID": setRID,
          "setName": setName
        }
      })
    };

    settings = function(Rid, Key, detail){
      get_setting_all = function() {
        ent:settings
      };
      get_setting = function(rid) {
        ent:settings{rid}
      };
      get_setting_value = function(rid, varible) {
        ent:settings{[rid, varible]}
      };
      get_data_value = function(rid, dataKey) {
        ent:settings{[rid, "data", dataKey]}
      };
      pick = function() {
        Rid.isnull() => get_setting_all()
        | Key.isnull() => get_setting(Rid)
        | detail.isnull() => get_setting_value(Rid, Key)
        | get_data_value(Rid, detail)
      };
      {
       "status"   : "success",
        "settings" : pick()
      };
    }

    setting_data = function(setRID) {
     ent:settings{[setRID, "data"]}
    };

    setting_schema = function(setRID) {
     ent:settings{[setRID, "schema"]}
    };

    setting_data_value = function(setRID, setKey) {
      ent:settings{[setRID, "data", setKey]}
    };

    get_setting_data_value = function(setRID, setKey) {
      setting_data_value(setRID, setKey)
    }

    config_value = function(setKey) {
      setRID = meta:callingRID();
      ent:settings{[setRID, "data", setKey]}
    };

    get_config_value = function(setKey) {
      config_value(setKey)
    }

    getChannelEci = function() {
      ent:pds_channel_eci
    }

    defaultProfile = {
      "name": "",
      "description": "",
      "photo": defaultUnknownPhoto
    };

  }//End Global
// Rules

//------------------------------- ent: general

  rule add_item {
    select when pds new_data_available
    pre {
      namespace = event:attr("namespace").defaultsTo("", "no namespace");
      keyvalue = event:attr("key").defaultsTo("", "no key");
      value = event:attr("value").defaultsTo("", "no value");
    }
    noop()
    always {
      ent:general{[namespace, keyvalue]} := value;
      raise pds event "data_added"
        attributes {"namespace": namespace, "keyvalue": keyvalue}
    }
  }

  rule update_item {
    select when pds updated_data_available
        foreach(event:attr("value") || {}) setting(avalue, akey)
    pre {
      namespace = event:attr("namespace").defaultsTo("", "no namespace");
      keyvalue = event:attr("key").defaultsTo("", "no key");
    }
    noop()
    always {
      ent:general{[namespace, keyvalue, akey]} := avalue;
      raise pds event "data_updated"
        attributes {"namespace": namespace, "keyvalue": keyvalue};
    }
  }

  rule remove_item {
    select when pds remove_old_data
    pre{
      namespace = event:attr("namespace").defaultsTo("", "no namespace");
      keyvalue = event:attr("key").defaultsTo("", "no key");
    }
    noop()
    always {
      clear ent:general{[namespace, keyvalue]};
      raise pds event "data_deleted"
        attributes {"namespace": namespace, "keyvalue": keyvalue}
    }
  }

  rule remove_namespace {
    select when pds remove_namespace
    pre{
      namespace = event:attr("namespace").defaultsTo("", "no namespace");
    }
    noop()
    always {
      clear ent:general{namespace};
      raise pds event "namespace_deleted"
        attributes {"namespace": namespace}
    }
  }

  rule itemed_mapped {
    select when pds map_item
    pre{
      namespace = event:attr("namespace").defaultsTo("", "no namespace");
      mapvalues = event:attr("mapvalues").defaultsTo("", "no mapvalues").decode();
    }
    noop()
    always {
      ent:general{namespace} := mapvalues;
      raise pds event "new_map_added"
        attributes {"namespace": namespace, "mapvalues": mapvalues};
    }
  }

  rule update_profile {
    select when pds updated_profile
    pre {
      newProfile = event:attrs.defaultsTo({}, "no attrs");
      created = function(){
        time:strftime(time:now(), "%Y%m%dT%H%M%S%z", {"tz":"UTC"});
      };

      buildProfile = function(newProfile){
        profile = ent:profile || defaultProfile;
        keepOrSet = function(key) {
          newProfile{key}.isnull() => profile{key} | newProfile{key}
        };
        newProfile
                  .put(["name"], keepOrSet("name"))
                  .put(["description"], keepOrSet("description"))
                  .put(["photo"], keepOrSet("photo"))
                  .put(["email"], keepOrSet("email"))
                  .put(["phone"], keepOrSet("phone"))
                  .put(["_created"], (profile{"_created"} || created()))
                  .put(["_modified"], time:strftime(time:now(), "%Y%m%dT%H%M%S%z", {"tz":"UTC"}))
      };
      newly_constructed_profile = (newProfile.keys().length() > 0) =>
                                    buildProfile(newProfile) |
                                      "nothing to update";

    }
    if newly_constructed_profile != "nothing to update" then
      noop()
    fired {
      ent:profile := newly_constructed_profile;
      raise pds event "profile_updated" attributes newProfile.put(["_status"], "success");
    }
    else {
      raise pds event "profile_updated" attributes newProfile.put(["_status"], "failure");
    }
  }

  rule settings_added {
    select when pds add_settings
    pre {
      set_name   = event:attr("name").defaultsTo(0, "no Name");
      set_rid    = event:attr("keyed_rid").defaultsTo(0, "no keyed_rid");
      set_schema = event:attr("schema").defaultsTo(0, "no Schema");
      set_attr   = event:attr("data_key").defaultsTo(0, "no setAttr");
      set_value  = event:attr("value").defaultsTo(0, "no Value");

    }
    noop()
    always {
      ent:settings{[set_rid, "name"]} := set_name;
      ent:settings{[set_rid, "rid"]} := set_rid;
      ent:settings{[set_rid, "schema"]} := set_schema if set_schema;
      ent:settings{[set_rid, "data", set_attr]} := set_value if set_attr;
      raise pds event "settings_added" attributes event:attrs;
    }
  }

  rule create_pds_channel {
    select when wrangler ruleset_installed where event:attr("rids") >< ctx:rid
    pre {
      channelName = "pds"
      eventPolicy = {"allow": [{"domain": "pds", "name": "*"}], "deny": []}
      queryPolicy = {"allow": [{"rid": "io.picolabs.pds", "name": "*"}], "deny": []}
      existing_channels = wrangler:channels()
      pds_channel = existing_channels.filter(function(chan) {
        chan{"name"} == channelName
      })
      channel_exists = pds_channel.length() > 0
    }
    if not channel_exists then
      wrangler:createChannel([channelName], eventPolicy, queryPolicy) setting(channel)
    fired {
      ent:pds_channel_eci := channel_exists => pds_channel.head(){"id"} | channel{"id"}
    }
  }

  rule seed_profile_name {
    select when wrangler ruleset_installed where event:attr("rids") >< ctx:rid
    pre {
      wrangler_name = wrangler:myself(){"name"}
      existing_name = ent:profile{"name"}
      needs_seed = wrangler_name && (existing_name.isnull() || existing_name == "")
    }
    if needs_seed then noop()
    fired {
      raise pds event "updated_profile" attributes {"name": wrangler_name}
    }
  }

  rule clearPDS {
    select when pds clear_all_data
    noop()
    always {
      clear ent:general;
      clear ent:profile;
      clear ent:settings;
    }
  }

}
