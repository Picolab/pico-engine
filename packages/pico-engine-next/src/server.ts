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

  app.all("/ui-eci", function(req, res, next) {
    res.json(uiECI);
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

  app.all("/c/:eci/query/:rid/:name", function(req, res, next) {
    pf.query({
      eci: req.params.eci,
      rid: req.params.rid,
      name: req.params.name,
      args: { attrs: mergeGetPost(req) }
    })
      .then(function(data) {
        res.json(data);
      })
      .catch(next);
  });

  return app;
}
