/**
 * Pico view shell (S1): optional Sky bearer for DataSource/APICall when the mesh
 * requires OAuth. Loads the vendored XMLUI runtime after installing fetch hooks.
 */
(function picoViewBoot() {
  var eci = window.__PICO_VIEW_ECI;
  var xmluiScript = window.__PICO_XMLUI_SCRIPT || "/xmlui/0.12.7.js";
  var authHeaders = {};

  function normPath(p) {
    if (!p || p === "/") return "/";
    return p.replace(/\/+$/, "") || "/";
  }

  function appRootPath() {
    return (window.__PUBLIC_PATH || "").replace(/\/+$/, "");
  }

  function useHashRouting() {
    if (window.__PICO_VIEW_USE_HASH_ROUTING === "false") return false;
    if (window.__PICO_VIEW_USE_HASH_ROUTING === "true") return true;
    return !!window.__PICO_VIEW_ECI;
  }

  /** XMLUI standalone defaults to hash routing; pathnames stay at the app root. */
  function syncRoutesBeforeXmlui() {
    var root = appRootPath();
    if (!root) return;

    if (useHashRouting()) {
      var path = window.location.pathname;
      if (path.indexOf(root) === 0) {
        var rest = path.slice(root.length).replace(/^\/+/, "").replace(/\/+$/, "");
        if (rest) {
          var hashRoute = rest.charAt(0) === "/" ? rest : "/" + rest;
          window.history.replaceState(
            null,
            "",
            root + "/" + window.location.search + "#" + hashRoute
          );
          return;
        }
      }
      var fb = window.__XMLUI_FALLBACK_PATH || "/";
      if (!fb.startsWith("/")) fb = "/" + fb;
      var hash = window.location.hash;
      if (!hash || hash === "#") {
        window.history.replaceState(
          null,
          "",
          root + "/" + window.location.search + "#" + fb
        );
      }
      return;
    }

    if (window.location.pathname === root) {
      window.history.replaceState(
        null,
        "",
        root + "/" + window.location.search + window.location.hash
      );
    }

    var fbPath = window.__XMLUI_FALLBACK_PATH;
    if (!fbPath || fbPath === "/") return;
    var here = normPath(window.location.pathname);
    if (here !== normPath(root)) return;
    var segment = fbPath.replace(/^\//, "");
    window.history.replaceState(
      null,
      "",
      root + "/" + segment + window.location.search + window.location.hash
    );
  }

  syncRoutesBeforeXmlui();

  function patchFetch() {
    var origFetch = window.fetch;
    window.fetch = function (input, init) {
      var url =
        typeof input === "string"
          ? input
          : input && input.url
            ? input.url
            : "";
      if (
        url.indexOf("/sky/query/") !== -1 ||
        url.indexOf("/sky/event/") !== -1 ||
        url.indexOf("/sky/cloud/") !== -1
      ) {
        init = init || {};
        var h = new Headers(init.headers || {});
        if (authHeaders.Authorization) {
          h.set("Authorization", authHeaders.Authorization);
        }
        init.headers = h;
      }
      if (typeof url === "string" && url.indexOf("config.json") !== -1) {
        return origFetch(input, init).then(function (res) {
          if (!res.ok) return res;
          return res.clone().json().then(function (cfg) {
            cfg.appGlobals = cfg.appGlobals || {};
            cfg.appGlobals.auth = authHeaders;
            if (useHashRouting()) {
              cfg.appGlobals.useHashBasedRouting = true;
              cfg.xmluiConfig = cfg.xmluiConfig || {};
              cfg.xmluiConfig.useHashBasedRouting = true;
            }
            return new Response(JSON.stringify(cfg), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          });
        });
      }
      return origFetch(input, init);
    };
  }

  function loadXmlui() {
    patchFetch();
    var s = document.createElement("script");
    s.src = xmluiScript;
    s.onload = function () {
      if (window.xmlui && typeof window.xmlui.startApp === "function") {
        window.xmlui.startApp();
      }
    };
    document.head.appendChild(s);
  }

  if (!eci) {
    loadXmlui();
    return;
  }

  fetch("/api/ui-sky-context?eci=" + encodeURIComponent(eci))
    .then(function (r) {
      return r.ok ? r.json() : { bearerRequired: false };
    })
    .then(function (ctx) {
      if (ctx && ctx.bearerRequired) {
        var tok = sessionStorage.getItem("picoViewBearer");
        if (tok) authHeaders = { Authorization: "Bearer " + tok };
      }
      loadXmlui();
    })
    .catch(function () {
      loadXmlui();
    });
})();
