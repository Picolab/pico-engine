import fetch from "cross-fetch";
import { krl, KrlCtx } from "krl-stdlib";
import { PicoEngineCore } from "../PicoEngineCore";
const qs = require("qs");

function ensureMap(arg: any, defaultTo: any) {
  return krl.isMap(arg) ? arg : defaultTo;
}

function stringifyQueryString(data: any): string {
  return qs.stringify(data, {
    arrayFormat: "bracket",
    format: "RFC3986",
  });
}

interface HttpResponse<T = any> {
  content: T;
  content_type: string | null;
  content_length: number;
  headers: { [header: string]: string };
  status_code: number;
  status_line: string;
}

async function httpBase(
  method: string,
  url: string,
  qs?: any,
  headers?: any,
  body?: any,
  auth?: any,
  json?: any,
  form?: any,
  parseJSON?: any,
  dontFollowRedirect?: any
): Promise<HttpResponse> {
  let opts: any = {
    method: method,
    headers: Object.assign(
      { "user-agent": "pico-engine-core-http" },
      ensureMap(headers, {})
    ),
  };

  if (auth && krl.isString(auth.username)) {
    const authHeader = `${auth.username}:${
      krl.isString(auth.password) ? auth.password : ""
    }`;
    (opts.headers as any)["Authorization"] =
      "Basic " + Buffer.from(authHeader).toString("base64");
  }

  if (qs) {
    url = url + "?" + stringifyQueryString(qs);
  }

  if (body) {
    opts.body = krl.toString(body);
  } else if (json) {
    opts.body = krl.encode(json);
    if (!opts.headers["content-type"]) {
      opts.headers["content-type"] = "application/json";
    }
  } else if (form) {
    opts.body = stringifyQueryString(form);
    if (!opts.headers["content-type"]) {
      opts.headers["content-type"] = "application/x-www-form-urlencoded";
    }
  }

  if (dontFollowRedirect) {
    opts.redirect = "manual";
  }

  return fetch(url, opts).then(async (res) => {
    const headers: { [header: string]: string } = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });

    let r: HttpResponse = {
      content: await res.text(),
      content_type: res.headers.get("content-type"),
      content_length:
        parseInt(res.headers.get("content-length") || "", 10) || 0,
      headers,
      status_code: res.status,
      status_line: res.statusText,
    };
    if (parseJSON === true) {
      try {
        r.content = krl.decode(r.content);
      } catch (e) {
        // just leave the content as is
      }
    }
    return r;
  });
}

function mkMethod(
  core: PicoEngineCore,
  method: string,
  canAlsoBeUsedAsAFunction: boolean = false
) {
  const params = [
    // NOTE: order is significant so it's a breaking API change to change argument ordering
    "url",
    "qs",
    "headers",
    "body",
    "auth",
    "json",
    "form",
    "parseJSON",
    "autoraise",
    "autosend",
    "dontFollowRedirect",
  ];
  const fn: (this: KrlCtx, ...args: any[]) => any = async function (
    url,
    qs,
    headers,
    body,
    auth,
    json,
    form,
    parseJSON,
    autoraise,
    autosend,
    dontFollowRedirect
  ) {
    if (!url) {
      throw new Error("http:" + method.toLowerCase() + " needs a url string");
    }
    if (!krl.isString(url)) {
      throw new TypeError(
        "http:" +
          method.toLowerCase() +
          " was given " +
          krl.toString(url) +
          " instead of a url string"
      );
    }
    if (autosend) {
      autosend = core.picoFramework.cleanEvent(autosend);
    }

    const httpPromise = httpBase(
      method,
      url,
      qs,
      headers,
      body,
      auth,
      json,
      form,
      parseJSON,
      dontFollowRedirect
    );

    if (autosend) {
      httpPromise
        .then((resp) => {
          return core.picoFramework.event({
            ...autosend,
            data: {
              attrs: {
                ...autosend.data.attrs,
                ...resp,
              },
            },
          });
        })
        .catch((error) => {
          this.log.error("http autosend error", { error });
        });
      return;
    }

    const r = await httpPromise;

    if (autoraise) {
      this.rsCtx.raiseEvent("http", method.toLowerCase(), {
        ...r,
        label: krl.toString(autoraise),
      });
    }
    return r;
  };

  return canAlsoBeUsedAsAFunction
    ? krl.ActionFunction(params, fn)
    : krl.Action(params, fn);
}

export default function initHttpModule(core: PicoEngineCore) {
  const module: krl.Module = {
    get: mkMethod(core, "GET", true),
    head: mkMethod(core, "HEAD", true),

    post: mkMethod(core, "POST"),
    put: mkMethod(core, "PUT"),
    patch: mkMethod(core, "PATCH"),
    delete: mkMethod(core, "DELETE"),
  };
  return module;
}
