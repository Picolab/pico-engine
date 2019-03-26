import * as bodyParser from "body-parser";
import * as express from "express";
import { Express, Request } from "express";
import * as helmet from "helmet";
import * as _ from "lodash";
import * as path from "path";
import { PicoFramework } from "pico-framework";
import { PicoEngineConf } from "./configuration";

function mergeGetPost(req: Request) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers });
}

export function server(
  pf: PicoFramework,
  conf: PicoEngineConf,
  uiECI: string
): Express {
  const app = express();

  app.use(helmet());
  app.use(express.static(path.resolve(__dirname, "..", "public")));
  app.use(bodyParser.json({ type: "application/json" }));
  app.use(
    bodyParser.urlencoded({
      limit: "512mb",
      type: "application/x-www-form-urlencoded",
      extended: false
    })
  );

  app.all("/api/ui-context", function(req, res, next) {
    res.json({ version: conf.version, eci: uiECI });
  });

  app.all("/api/rulesets", function(req, res, next) {
    // TODO load from pf

    res.json({
      rulesets: {
        "io.picolabs.next": ["0.0.0"],
        "io.picolabs.foo": ["0.0.0", "1.1.1", "2.2.2"],
        "io.picolabs.bar": ["1.1.1", "2.2.2", "3.3.3"]
      }
    });
  });

  app.all("/c/:eci/event/:domain/:name", function(req, res, next) {
    pf.event({
      eci: req.params.eci,
      domain: req.params.domain,
      name: req.params.name,
      data: { attrs: mergeGetPost(req) },
      time: 0 // TODO remove this typescript requirement
    })
      .then(function(data) {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/c/:eci/event-wait/:domain/:name", function(req, res, next) {
    pf.eventWait({
      eci: req.params.eci,
      domain: req.params.domain,
      name: req.params.name,
      data: { attrs: mergeGetPost(req) },
      time: 0 // TODO remove this typescript requirement
    })
      .then(() => {
        res.json({ ok: true });
      })
      .catch(next);
  });

  app.all("/c/:eci/event/:domain/:name/query/:rid/:qname", function(
    req,
    res,
    next
  ) {
    const attrs = mergeGetPost(req);
    pf.eventQuery(
      {
        eci: req.params.eci,
        domain: req.params.domain,
        name: req.params.name,
        data: { attrs },
        time: 0 // TODO remove this typescript requirement
      },
      {
        eci: req.params.eci,
        rid: req.params.rid,
        name: req.params.qname,
        args: attrs
      }
    )
      .then(function(data) {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/c/:eci/query/:rid/:name", function(req, res, next) {
    pf.query({
      eci: req.params.eci,
      rid: req.params.rid,
      name: req.params.name,
      args: mergeGetPost(req)
    })
      .then(function(data) {
        res.json(data);
      })
      .catch(next);
  });

  return app;
}
