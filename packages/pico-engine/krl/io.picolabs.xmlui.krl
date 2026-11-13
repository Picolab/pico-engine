ruleset io.picolabs.xmlui {
  meta {
    name "XMLUI views"
    description "Optional ruleset for pico views (XMLUI): file(), markup helpers, app channels."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    provides query_url, event_url, query, event, escape, app_url, create_app_channel, rotate_app_channel, xmluiRuntimePath
    shares file, query_url, event_url, query, event, escape, app_url, xmluiRuntimePath,
      picoTheme, picoSettings, picoThemeField, picoAccessTokenField
  }

  global {
    xmluiRuntimeVersion = "0.14.28"
    xmluiFileRid = "io.picolabs.xmlui"

    xmluiRuntimePath = function() {
      "/xmlui/" + xmluiRuntimeVersion + ".js"
    }

    query_url = function(name, rid, eci) {
      "/sky/query/" + (eci || meta:eci) + "/" + (rid || meta:rid) + "/" + name
    }

    event_url = function(domain, type, eci) {
      "/sky/event/" + (eci || meta:eci) + "/xmlui/" + domain + "/" + type
    }

    escape = function(s) {
      s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
    }

    escapeAttr = function(s) {
      escape(s)
    }

    queryArgsSuffix = function(args) {
      args.isnull() || args == {} => "" |
      args.keys().length() == 0 => "" |
      "?" + args.keys()
        .sort()
        .map(function(k) {
          k + "=" + args{k}
        })
        .join("&")
    }

    /**
     * @param id DataSource id
     * @param name shared query name on app_rid
     * @param opts rid, args (map, values may be XMLUI bindings), select
     */
    query = function(id, name, opts) {
      "<DataSource id=\"" + escapeAttr(id) + "\" url=\"" +
        escapeAttr(
          query_url(
            name,
            (opts.defaultsTo({}){"rid"} || meta:rid),
            meta:eci
          ) + queryArgsSuffix(opts.defaultsTo({}){"args"})
        ) +
        "\" headers=\"{appGlobals.auth}\"" +
        (opts.defaultsTo({}){"select"}.isnull() => "" |
          " resultSelector=\"" + escapeAttr(opts.defaultsTo({}){"select"}) + "\"") +
        " />"
    }

    /**
     * @param id APICall id
     * @param opts refresh (array of DataSource ids), confirm
     */
    event = function(id, domain, type, opts) {
      "<APICall id=\"" + escapeAttr(id) + "\" method=\"post\" url=\"" +
        escapeAttr(event_url(domain, type, meta:eci)) +
        "\" headers=\"{appGlobals.auth}\" body=\"{$param}\"" +
        (opts.defaultsTo({}){"refresh"}.isnull() => "" |
          " onSuccess=\"" + opts.defaultsTo({}){"refresh"}.map(function(ds) {
            ds + ".refetch()"
          }).join(";") + "\"") +
        (opts.defaultsTo({}){"confirm"}.isnull() => "" |
          " confirm=\"" + escapeAttr(opts.defaultsTo({}){"confirm"}) + "\"") +
        " />"
    }

    // A channel matches when it has every requested tag. Extra tags, such as
    // oauth-webhook on the app channel, still match.
    newestChannelWithTags = function(tags) {
      wanted = tags.typeof() == "Array" => tags.map(function(t) { t.lc() }) |
        tags.typeof() == "String" => tags.lc().split(",") |
        []
      wrangler:channels()
        .filter(function(c) {
          have = c{"tags"}.defaultsTo([]).map(function(t) { t.lc() })
          wanted.filter(function(t) { have >< t }).length() == wanted.length()
        })
        .sort(function(a, b) { a{"id"} cmp b{"id"} })
        .reverse()
        .head()
    }

    app_url = function(tags, app_rid) {
      newestChannelWithTags(tags).isnull() => null |
      "/ui/" + newestChannelWithTags(tags){"id"} + "/" +
        (app_rid || meta:rid) + "/"
    }

    shareNamesForApp = function(app_rid) {
      wrangler:rulesetSchema(app_rid){"queries"}
        .defaultsTo([])
        .map(function(q) {
          q{"name"}
        })
    }

    componentNamesFor = function(rid) {
      wrangler:rulesetSchema(rid){"queries"}
        .defaultsTo([])
        .filter(function(q) {
          not q{"component"}.isnull()
        })
        .map(function(q) {
          q{"name"}
        })
    }

    // The app's named queries, every @component of the app ruleset and of
    // this ruleset, and file. A channel that omits a component cannot load it.
    queryPolicyForApp = function(app_rid, queries) {
      (queries.isnull() => shareNamesForApp(app_rid) | queries)
        .append(componentNamesFor(app_rid))
        .map(function(q) {
          { "rid": app_rid, "name": q }
        })
        .append(componentNamesFor(xmluiFileRid).map(function(q) {
          { "rid": xmluiFileRid, "name": q }
        }))
        .append([{ "rid": xmluiFileRid, "name": "file" }])
        .reduce(function(acc, entry) {
          acc.filter(function(r) {
            r{"rid"} == entry{"rid"} && r{"name"} == entry{"name"}
          }).length() > 0 => acc | acc.append([entry])
        }, [])
    }

    allowsRule = function(allow, rid, name) {
      allow.filter(function(r) {
        r{"rid"} == rid && r{"name"} == name
      }).length() > 0
    }

    // App channels are the ones the UI route can serve from.
    appChannels = function() {
      wrangler:channels().filter(function(c) {
        allowsRule(c{["queryPolicy", "allow"]}.defaultsTo([]), xmluiFileRid, "file")
      })
    }

    // Component queries the channel lacks: every @component of each ruleset
    // the channel already allows, and of this ruleset. Never a new ruleset.
    missingComponentRules = function(channel) {
      have = channel{["queryPolicy", "allow"]}.defaultsTo([])
      rids = have.map(function(r) { r{"rid"} })
        .filter(function(rid) { rid != xmluiFileRid })
        .reduce(function(acc, rid) { acc >< rid => acc | acc.append(rid) }, [])
      rids.append([xmluiFileRid])
        .map(function(rid) {
          componentNamesFor(rid).map(function(name) { {"rid": rid, "name": name} })
        })
        .reduce(function(acc, rules) { acc.append(rules) }, [])
        .filter(function(entry) { not allowsRule(have, entry{"rid"}, entry{"name"}) })
    }

    eventPolicyForDomains = function(domains) {
      {
        "allow": domains.map(function(d) {
          { "domain": d, "name": "*" }
        }),
        "deny": []
      }
    }

    create_app_channel = defaction(tags, domains, queries, app_rid) {
      wrangler:createChannel(
        tags,
        eventPolicyForDomains(domains.defaultsTo([])),
        {
          "allow": queryPolicyForApp(app_rid || meta:rid, queries),
          "deny": []
        }
      )
    }

    rotate_app_channel = defaction(tags) {
      template = newestChannelWithTags(tags)
      wrangler:createChannel(
        template{"tags"},
        template{"eventPolicy"},
        template{"queryPolicy"}
      )
    }

    viewComponentName = function(fn) {
      fn.substr(0, 1).uc() + fn.substr(1)
    }

    viewQueriesOnChannel = function(app_rid) {
      wrangler:channelSchema(meta:eci){"queries"}
        .defaultsTo([])
        .filter(function(q) {
          q{"rid"} == app_rid && not q{"view"}.isnull()
        })
    }

    launcherRids = function() {
      wrangler:channelSchema(meta:eci){"queries"}
        .defaultsTo([])
        .filter(function(q) {
          not q{"view"}.isnull()
        })
        .map(function(q) {
          q{"rid"}
        })
        .sort()
        .reduce(function(acc, rid) {
          acc >< rid => acc | acc.append(rid)
        }, [])
    }

    pageRoute = function(view, fn, multiView) {
      not view{"path"}.isnull() => view{"path"} |
      multiView => "/" + fn | "/"
    }

    navVisible = function(view) {
      view{"path"}.isnull() => true |
      view{"path"}.split(":").length() == 1
    }

    firstNavViewQuery = function(app_rid) {
      viewQueriesOnChannel(app_rid).filter(function(q) {
        navVisible(q{"view"})
      }).head()
    }

    fallbackWhenNoNavViews = function(multiView) {
      not multiView => "/" | "/"
    }

    fallbackPathForApp = function(app_rid, multiView) {
      nav = firstNavViewQuery(app_rid)
      nav.isnull() => fallbackWhenNoNavViews(multiView) |
      pageRoute(nav{"view"}, nav{"name"}, multiView)
    }

    multiViewForApp = function(app_rid) {
      viewQueriesOnChannel(app_rid).length() > 1
    }

    appRulesetName = function(app_rid) {
      wrangler:rulesetMeta(app_rid).isnull() => app_rid |
      wrangler:rulesetMeta(app_rid){"name"} || app_rid
    }

    indexHtml = function(app_rid) {
      "<html lang=\"en\"><head><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><script>window.__PUBLIC_PATH=\"/ui/" +
        meta:eci + "/" + app_rid + "\";window.__PICO_VIEW_ECI=\"" + meta:eci +
        "\";window.__PICO_XMLUI_SCRIPT=\"" + xmluiRuntimePath() +
        "\";window.__XMLUI_FALLBACK_PATH=\"" +
        escapeAttr(fallbackPathForApp(app_rid, multiViewForApp(app_rid))) +
        "\";window.__PICO_VIEW_USE_HASH_ROUTING=\"true\";</script><base href=\"/ui/" +
        meta:eci + "/" + app_rid +
        "/\" /><script src=\"/xmlui/pico-view-boot.js?v=" + xmluiRuntimeVersion +
        "-pico2\"></script></head><body></body></html>"
    }

    launcherTitle = function(rid) {
      wrangler:rulesetMeta(rid).isnull() => rid |
      wrangler:rulesetMeta(rid){"name"} || rid
    }

    launcherHtml = function() {
      "<html><body><ul>" +
        launcherRids().map(function(rid) {
          "<li><a href=\"/ui/" + meta:eci + "/" + rid + "\">" +
            escape(launcherTitle(rid)) + "</a></li>"
        }).join("") +
        "</ul></body></html>"
    }

    navLinksForApp = function(app_rid, multiView) {
      viewQueriesOnChannel(app_rid).filter(function(q) {
        navVisible(q{"view"})
      }).map(function(q) {
        "<NavLink label=\"" + escapeAttr(q{"view"}{"title"}) + "\" to=\"" +
          escapeAttr(pageRoute(q{"view"}, q{"name"}, multiView)) + "\" />"
      }).join("")
    }

    pagesForApp = function(app_rid, multiView) {
      viewQueriesOnChannel(app_rid).map(function(q) {
        "<Page url=\"" + escapeAttr(pageRoute(q{"view"}, q{"name"}, multiView)) +
          "\"><" + viewComponentName(q{"name"}) + " /></Page>"
      }).join("")
    }

    navPanelForApp = function(app_rid, multiView) {
      not multiView => "" |
      navLinksForApp(app_rid, multiView) == "" => "" |
      "<NavPanel>" + navLinksForApp(app_rid, multiView) + "</NavPanel>"
    }

    // XMLUI's default layout, condensed-sticky, mis-measures header height in
    // WebKit (Safari) and can hide page content. Do not add
    // scrollWholePage="false": in XMLUI 0.14 it makes each Table header as tall
    // as the table, which hides every row.
    shellAppAttrs = function() {
      " layout=\"vertical-sticky\""
    }

    mainXmlui = function(app_rid) {
      viewQueriesOnChannel(app_rid).length() == 0 => null |
      "<App name=\"" + escapeAttr(appRulesetName(app_rid)) + "\"" +
        shellAppAttrs() + ">" +
        navPanelForApp(app_rid, multiViewForApp(app_rid)) +
        "<Pages fallbackPath=\"" +
          escapeAttr(fallbackPathForApp(app_rid, multiViewForApp(app_rid))) +
          "\">" +
        pagesForApp(app_rid, multiViewForApp(app_rid)) +
        "</Pages></App>"
    }

    configJson = function(app_rid) {
      {
        "name": appRulesetName(app_rid),
        "appGlobals": {
          "eci": meta:eci,
          "appRid": app_rid,
          "picoName": wrangler:name(),
          "useHashBasedRouting": true
        },
        "xmluiConfig": { "useHashBasedRouting": true }
      }
    }

    file = function(rid, path) {
      rid == "" => launcherHtml() |
      path.defaultsTo("index.html") == "index.html" => indexHtml(rid) |
      path.defaultsTo("index.html") == "Main.xmlui" => mainXmlui(rid) |
      path.defaultsTo("index.html") == "config.json" => configJson(rid) |
      null
    }

    /**
     * Applies the theme stored in this browser tab (sessionStorage
     * picoViewTheme: default, dark, green, green-dark, gray, gray-dark) to
     * its children, on the theme's page background so rows stay readable
     * in dark tones. The padding keeps content off the panel's edge, which
     * shows in dark tones.
     * @component
     */
    picoTheme = function() {
      <<
<Component name="PicoTheme">
  <Theme
    themeId="{['green', 'green-dark'].includes(sessionStorage.getItem('picoViewTheme') || 'default') ? 'xmlui-green' : ['gray', 'gray-dark'].includes(sessionStorage.getItem('picoViewTheme') || 'default') ? 'xmlui-gray' : 'xmlui'}"
    tone="{(sessionStorage.getItem('picoViewTheme') || 'default').endsWith('dark') ? 'dark' : 'light'}">
    <VStack gap="$space-2" padding="$space-3" backgroundColor="$backgroundColor">
      <Slot />
    </VStack>
  </Theme>
</Component>
>>
    }

    /**
     * Settings dialog with no fields of its own. The caller adds fields as
     * children. Save stores each field in sessionStorage as picoView<Field>
     * (theme becomes picoViewTheme) and reloads the page.
     * Props: title, note. Method: open(). Event: saved(data).
     * @component
     */
    picoSettings = function() {
      <<
<Component name="PicoSettings" method.open="() => dialog.open()">
  <ModalDialog id="dialog" title="{$props.title ?? 'Settings'}">
    <Form saveLabel="Save"
          onSubmit="(data) => { Object.keys(data).forEach(k => sessionStorage.setItem('picoView' + k.charAt(0).toUpperCase() + k.slice(1), String(data[k] ?? '').trim())); emitEvent('saved', data); location.reload(); }">
      <Slot />
      <Text value="{($props.note ?? '') + ' This browser tab keeps these settings.'}" />
    </Form>
  </ModalDialog>
</Component>
>>
    }

    /**
     * Theme picker for PicoSettings. Pairs with PicoTheme.
     * @component
     */
    picoThemeField = function() {
      <<
<Component name="PicoThemeField">
  <FormItem bindTo="theme" label="Theme" type="select"
            initialValue="{sessionStorage.getItem('picoViewTheme') || 'default'}">
    <Option value="default" label="Default" />
    <Option value="dark" label="Dark" />
    <Option value="green" label="Green" />
    <Option value="green-dark" label="Green, dark" />
    <Option value="gray" label="Gray" />
    <Option value="gray-dark" label="Gray, dark" />
  </FormItem>
</Component>
>>
    }

    /**
     * Access token field for PicoSettings, for views on an OAuth mesh. It is
     * stored as picoViewBearer, which the view shell sends as the bearer on
     * Sky calls from this tab.
     * @component
     */
    picoAccessTokenField = function() {
      <<
<Component name="PicoAccessTokenField">
  <FormItem bindTo="bearer" label="Access token" type="password"
            initialValue="{sessionStorage.getItem('picoViewBearer') || ''}" />
</Component>
>>
    }
  }

  // When rulesets change, give each app channel the component queries it
  // lacks, so a channel created before a component existed can load it.
  rule allow_components_on_app_channels {
    select when wrangler schema_updated
    foreach appChannels() setting(channel)
    pre {
      missing = missingComponentRules(channel)
    }
    if missing.length() > 0 then
      wrangler:updateChannel(
        channel{"id"},
        channel{"tags"},
        channel{"eventPolicy"},
        {
          "allow": channel{["queryPolicy", "allow"]}.defaultsTo([]).append(missing),
          "deny": channel{["queryPolicy", "deny"]}.defaultsTo([])
        }
      )
  }
}
