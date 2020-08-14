import test from "ava";
import * as http from "http";
import * as _ from "lodash";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

test("http module", async function (t) {
  var server = http.createServer(function (req, res) {
    var body = "";
    req.on("data", function (buffer) {
      body += buffer.toString();
    });
    req.on("end", function () {
      var out;
      if (req.url === "/not-json-resp") {
        out = "this is not json";
        res.writeHead(200, {
          "Content-Length": Buffer.byteLength(out),
        });
        res.end(out);
        return;
      }
      out = JSON.stringify(
        {
          url: req.url,
          headers: req.headers,
          body: body,
        },
        undefined,
        2
      );
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(out),
        "da-extra-header": "wat?",
      });
      res.end(out);
    });
  });
  server.unref();
  await new Promise(function (resolve) {
    server.listen(0, resolve);
  });
  const host = "localhost:" + (server.address() as any).port;
  const url = "http://" + host;

  const { core, krlCtx } = await makeCoreAndKrlCtx();
  const khttp = core.modules["http"];

  var resp;

  var doHttp = async function (method: string, args: any) {
    var resp = await khttp[method](krlCtx as any, args);
    t.truthy(_.isNumber(resp.content_length));
    t.truthy(!_.isNaN(resp.content_length));
    delete resp.content_length; // windows can return off by 1 so it breaks tests
    delete resp.headers["content-length"]; // windows can return off by 1 so it breaks tests
    delete resp.headers["date"];
    return resp;
  };

  resp = await doHttp("get", [url, { a: 1 }]);
  resp.content = JSON.parse(resp.content);
  t.deepEqual(resp, {
    content: {
      url: "/?a=1",
      headers: {
        host,
        connection: "close",
        "user-agent": "pico-engine-core-http",
        accept: "*/*",
        "accept-encoding": "gzip,deflate",
      },
      body: "",
    },
    content_type: "application/json",
    status_code: 200,
    status_line: "OK",
    headers: {
      "content-type": "application/json",
      connection: "close",
      "da-extra-header": "wat?",
    },
  });

  // raw post body
  resp = await doHttp("post", {
    url: url,
    qs: { baz: "qux" },
    headers: { some: "header" },
    body: "some post data",
    json: { json: "get's overriden by raw body" },
    form: { form: "get's overriden by raw body" },
    auth: {
      username: "bob",
      password: "nopass",
    },
  });
  resp.content = JSON.parse(resp.content);
  t.deepEqual(resp, {
    content: {
      url: "/?baz=qux",
      headers: {
        some: "header",
        host,
        authorization: "Basic Ym9iOm5vcGFzcw==",
        "user-agent": "pico-engine-core-http",
        "content-length": "14",
        connection: "close",
        "content-type": "text/plain;charset=UTF-8",
        accept: "*/*",
        "accept-encoding": "gzip,deflate",
      },
      body: "some post data",
    },
    content_type: "application/json",
    status_code: 200,
    status_line: "OK",
    headers: {
      "content-type": "application/json",
      connection: "close",
      "da-extra-header": "wat?",
    },
  });

  // form body
  resp = await doHttp("post", {
    url: url,
    qs: { baz: "qux" },
    headers: { some: "header" },
    form: { formkey: "formval", foo: ["bar", "baz"] },
  });
  resp.content = JSON.parse(resp.content);
  t.deepEqual(resp, {
    content: {
      url: "/?baz=qux",
      headers: {
        some: "header",
        host,
        "content-type": "application/x-www-form-urlencoded",
        "content-length": "45",
        connection: "close",
        "user-agent": "pico-engine-core-http",
        accept: "*/*",
        "accept-encoding": "gzip,deflate",
      },
      body: "formkey=formval&foo%5B0%5D=bar&foo%5B1%5D=baz",
    },
    content_type: "application/json",
    status_code: 200,
    status_line: "OK",
    headers: {
      "content-type": "application/json",
      connection: "close",
      "da-extra-header": "wat?",
    },
  });

  // json body
  resp = await doHttp("post", {
    url: url,
    qs: { baz: "qux" },
    headers: { some: "header" },
    json: { formkey: "formval", foo: ["bar", "baz"] },
  });
  resp.content = JSON.parse(resp.content);
  t.deepEqual(resp, {
    content: {
      url: "/?baz=qux",
      headers: {
        some: "header",
        host,
        "content-type": "application/json",
        "content-length": "41",
        connection: "close",
        "user-agent": "pico-engine-core-http",
        accept: "*/*",
        "accept-encoding": "gzip,deflate",
      },
      body: '{"formkey":"formval","foo":["bar","baz"]}',
    },
    content_type: "application/json",
    status_code: 200,
    status_line: "OK",
    headers: {
      "content-type": "application/json",
      connection: "close",
      "da-extra-header": "wat?",
    },
  });

  // parseJSON
  resp = await doHttp("post", {
    url: url,
    parseJSON: true,
  });
  t.deepEqual(resp, {
    content: {
      url: "/",
      headers: {
        host,
        "content-length": "0",
        connection: "close",
        "user-agent": "pico-engine-core-http",
        accept: "*/*",
        "accept-encoding": "gzip,deflate",
      },
      body: "",
    },
    content_type: "application/json",
    status_code: 200,
    status_line: "OK",
    headers: {
      "content-type": "application/json",
      connection: "close",
      "da-extra-header": "wat?",
    },
  });

  // parseJSON when not actually a json response
  resp = await doHttp("post", {
    url: url + "/not-json-resp",
    parseJSON: true,
  });
  t.deepEqual(resp, {
    content: "this is not json",
    content_type: null,
    status_code: 200,
    status_line: "OK",
    headers: {
      connection: "close",
    },
  });

  for (const method of Object.keys(khttp)) {
    let err = await t.throwsAsync(khttp[method](krlCtx, { parseJSON: true }));
    t.is(err + "", `Error: http:${method} needs a url string`);

    err = await t.throwsAsync(khttp[method](krlCtx, { url: { one: 1 } }));
    t.is(
      err + "",
      `TypeError: http:${method} was given [Map] instead of a url string`
    );
  }
});

test("http autosend", async function (t) {
  const signaledEvents: any[] = [];

  const { core, krlCtx } = await makeCoreAndKrlCtx();
  const khttp = core.modules["http"];
  core.picoFramework.event = async (event, fromPicoId) => {
    signaledEvents.push(event);
  };

  // so we can wait for the server response
  let serverRespond: any;
  let serverResponse = new Promise((resolve) => {
    serverRespond = resolve;
  });

  const server = http.createServer(function (req, res) {
    res.end("some response");
    serverRespond();
  });
  server.unref();
  await new Promise(function (resolve) {
    server.listen(0, resolve);
  });
  const url = "http://localhost:" + (server.address() as any).port;

  const data = await khttp.get(krlCtx, {
    url,
    autosend: {
      eci: "some-eci",
      domain: "foo",
      name: "bar",
      data: {
        attrs: { some: "data" },
      },
    },
  });

  t.deepEqual(data, undefined, "should not return anything since it's async");
  t.deepEqual(
    signaledEvents,
    [],
    "should be empty bc the server has not yet responded"
  );

  await serverResponse;
  // wait for pico engine to do it's thing
  await new Promise((resolve) => setTimeout(resolve, 200));

  t.is(signaledEvents.length, 1, "now there should be a response");
  delete signaledEvents[0].time;
  delete signaledEvents[0].data.attrs.headers.date;

  t.deepEqual(signaledEvents, [
    {
      eci: "some-eci",
      domain: "foo",
      name: "bar",
      data: {
        attrs: {
          some: "data", // merged in from autosend.attrs

          content: "some response",
          content_length: 13,
          content_type: null,
          status_code: 200,
          status_line: "OK",
          headers: {
            connection: "close",
            "content-length": "13",
          },
        },
      },
    },
  ]);
});

test("http redirects", async function (t) {
  const { core, krlCtx } = await makeCoreAndKrlCtx();
  const khttp = core.modules["http"];

  const server = http.createServer(function (req, res) {
    if (req.url === "/redir") {
      res.writeHead(302, {
        Location: "/other",
      });
      res.end();
    } else {
      res.end("some response");
    }
  });
  server.unref();
  await new Promise(function (resolve) {
    server.listen(0, resolve);
  });
  const url = "http://localhost:" + (server.address() as any).port;

  let data = await khttp.get(krlCtx, {
    url: url + "/redir",
  });

  delete data.headers.date;

  t.deepEqual(data, {
    content: "some response",
    content_length: 13,
    content_type: null,
    headers: {
      connection: "close",
      "content-length": "13",
    },
    status_code: 200,
    status_line: "OK",
  });

  data = await khttp.get(krlCtx, {
    url: url + "/redir",
    dontFollowRedirect: true,
  });

  delete data.headers.date;
  t.deepEqual(data, {
    content: "",
    content_length: 0,
    content_type: null,
    headers: {
      connection: "close",
      location: url + "/other",
      "transfer-encoding": "chunked",
    },
    status_code: 302,
    status_line: "Found",
  });
});
