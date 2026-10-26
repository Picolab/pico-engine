ruleset io.picolabs.pds {
  meta {
    name "PDS"
    description <<
      Pico Data Services (PDS), a common data base structure for all rulesets to use.
    >>
    author "Picolabs"

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

    /**
     * Read general (namespaced) data. With no namespace, returns all of it; with a
     * namespace, that namespace's map; with both, one value. status is "failed"
     * when no namespace is given (the data is still returned).
     * @param namespace String "namespace to read; omit for everything"
     * @param key String "key within the namespace; omit for the whole namespace"
     * @returns Map "{ status, general }"
     * @example "one namespace" { "namespace": "<app>" }
     * @example "one value" { "namespace": "<app>", "key": "<key>" }
     */
    items = function (namespace = null, key = null){
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

    /**
     * Keys stored in one namespace of the general data.
     * @param namespace String
     * @returns Array
     */
    get_keys = function(namespace) {
      ent:general{namespace}.keys()
    }

    /**
     * This pico's profile: name, description, photo, email, phone, and the
     * _created / _modified timestamps. With a key, just that field.
     * @param key String "profile field to read; omit for the whole profile"
     * @returns Map "{ status, profile }"
     * @example "whole profile" {}
     * @example "name only" { "key": "name" }
     */
    profile = function(key = null){
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

    /**
     * Rulesets that have stored settings here, with their display names.
     * @returns Array "[ { setRID, setName } ]"
     */
    settings_names = function() {
      ent:settings.keys().map(function(setRID) {
        setName = ent:settings{[setRID, "name"]};
        {
          "setRID": setRID,
          "setName": setName
        }
      })
    };

    /**
     * Read per-ruleset settings. No arguments: all settings. Rid: that ruleset's
     * settings record ({ name, rid, data, schema }). Rid and Key: one field of the
     * record. Rid, Key, and detail: the value of data key `detail` (Key is ignored).
     * @param Rid String "ruleset id whose settings to read"
     * @param Key String "field of the settings record (name, rid, data, schema)"
     * @param detail String "key within the record's data map"
     * @returns Map "{ status, settings }"
     * @example "one ruleset" { "Rid": "<rid>" }
     * @example "one data value" { "Rid": "<rid>", "Key": "data", "detail": "<key>" }
     */
    settings = function(Rid = null, Key = null, detail = null){
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

    /**
     * One configuration value from a ruleset's settings data.
     * @param setRID String "ruleset id"
     * @param setKey String "data key"
     * @returns Any
     */
    get_setting_data_value = function(setRID, setKey) {
      setting_data_value(setRID, setKey)
    }

    /**
     * One configuration value from the calling ruleset's own settings data. Meant
     * to be used as a module function (use module io.picolabs.pds): the ruleset is
     * the caller's, from meta:callingRID().
     * @param setKey String "data key"
     * @returns Any
     */
    config_value = function(setKey) {
      setRID = meta:callingRID();
      ent:settings{[setRID, "data", setKey]}
    };

    /**
     * Same as config_value: a value from the calling ruleset's own settings data,
     * for use as a module function.
     * @param setKey String "data key"
     * @returns Any
     */
    get_config_value = function(setKey) {
      config_value(setKey)
    }

    /**
     * The ECI of this pico's pds channel, which allows all pds events and queries.
     * Created when this ruleset is installed.
     * @returns String
     */
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

  /**
   * Store one value in the general data under namespace and key, replacing any
   * existing value. Raises pds:data_added.
   * @attr namespace String "namespace, e.g. your app's name"
   * @attr key String
   * @attr value Any "value to store"
   * @example "store a value" { "namespace": "<app>", "key": "<key>", "value": "<value>" }
   */
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

  /**
   * Merge fields into a stored map: each entry of value is written under
   * namespace / key / field, leaving other fields alone. Raises pds:data_updated
   * once per field.
   * @attr namespace String
   * @attr key String
   * @attr value Map "fields to set on the stored map"
   * @example "set fields" { "namespace": "<app>", "key": "<key>", "value": { "<field>": "<value>" } }
   */
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

  /**
   * Delete one key from a namespace of the general data. Raises pds:data_deleted.
   * @attr namespace String
   * @attr key String
   */
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

  /**
   * Delete a whole namespace of the general data. Raises pds:namespace_deleted.
   * @attr namespace String
   */
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

  /**
   * Replace an entire namespace of the general data with a map. Raises
   * pds:new_map_added.
   * @attr namespace String
   * @attr mapvalues String "the new namespace contents, as a JSON-encoded map"
   * @example "replace namespace" { "namespace": "<app>", "mapvalues": "{\"<key>\": \"<value>\"}" }
   */
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

  /**
   * Update this pico's profile. Send only the fields to change; fields not sent
   * keep their current values. _created is set on the first update and _modified
   * on every update. Raises pds:profile_updated with _status "success", or
   * "failure" when no fields were sent.
   * @attr name String optional "display name"
   * @attr description String optional
   * @attr photo String optional "image URL or data: URI"
   * @attr email String optional
   * @attr phone String optional
   * @example "rename" { "name": "<name>" }
   * @example "contact info" { "email": "<email>", "phone": "<phone>" }
   */
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

  /**
   * Create or update a ruleset's settings record, and optionally set one data
   * value in it. Raises pds:settings_added.
   * @attr keyed_rid String "ruleset id the settings belong to"
   * @attr name String "display name for the settings"
   * @attr schema Array optional "settings schema, stored as given"
   * @attr data_key String optional "data key to set"
   * @attr value Any optional "value for data_key"
   * @example "register settings" { "keyed_rid": "<rid>", "name": "<display name>" }
   * @example "set one value" { "keyed_rid": "<rid>", "name": "<display name>", "data_key": "<key>", "value": "<value>" }
   */
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

  // Erases all general data, the profile, and all settings with no confirmation.
  // Deliberately not discoverable.
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
