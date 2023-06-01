ruleset io.picolabs.cookies {
  meta {
    use module io.picolabs.wrangler alias wrangler
    provides cookies
    shares __testing, cookies
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "cookies" } ],
                  "events": [ {"domain": "cookie", "type": "wellKnown_Rx_changed" } ] }
    cookies = function(_headers) {
      arg = event:attr("_headers") || _headers;
      arg{"cookie"}.isnull() => {} |
      arg{"cookie"}                      //.klog("cookie")
        .split("; ")                     //.klog("split")
        .map(function(v){v.split("=")})  //.klog("map1")
        .collect(function(v){v.head()})  //.klog("collect")
        .map(function(v){v.head()[1]})   //.klog("map2")
    }
  }
  rule set_cookie_for_wellKnown_Rx {
    select when cookie wellKnown_Rx_changed
    pre {
      eci = wrangler:channel("wellKnown_Rx"){"id"};
      name = event:attr("cookie_name") || "wellKnown_Rx";
    }
    if eci then every {
      send_directive("_cookie",{"cookie": <<#{name}=#{eci}; Path=/sky>>});
    }
  }
}
