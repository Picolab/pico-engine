ruleset io.picolabs.xmlui {
  meta {
    name "XMLUI views"
    description "Optional ruleset for pico views (XMLUI): file(), markup helpers, app channels."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    provides query_url, event_url, query, event, escape, app_url, create_app_channel, rotate_app_channel, xmluiRuntimePath
    shares file, query_url, event_url, query, event, escape, app_url, xmluiRuntimePath
  }

  global {
    xmluiRuntimeVersion = "0.12.7"
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

    newestChannelWithTags = function(tags) {
      wrangler:channels(tags).sort(function(a, b) {
        a{"id"} cmp b{"id"}
      }).reverse().head()
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

    queryPolicyForApp = function(app_rid, queries) {
      (queries.isnull() => shareNamesForApp(app_rid) | queries)
        .map(function(q) {
          { "rid": app_rid, "name": q }
        })
        .append([{ "rid": xmluiFileRid, "name": "file" }])
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

    // XMLUI defaults: layout condensed-sticky, scrollWholePage true. That combo
    // mis-measures header height in WebKit (Safari) and can hide page content.
    shellAppAttrs = function() {
      " layout=\"vertical-sticky\" scrollWholePage=\"false\""
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
  }

}
