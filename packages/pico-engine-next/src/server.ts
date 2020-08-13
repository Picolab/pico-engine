import * as bodyParser from "body-parser";
import * as express from "express";
import { Express, Request } from "express";
import * as helmet from "helmet";
import * as _ from "lodash";
import * as path from "path";
import { PicoFramework } from "pico-framework";

const engineVersion = require("../package.json").version;

function mergeGetPost(req: Request) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers });
}

export function server(pf: PicoFramework, uiECI: string): Express {
  const app = express();

  app.use(helmet());
  app.use(express.static(path.resolve(__dirname, "..", "public")));
  app.use(bodyParser.json({ type: "application/json" }));
  app.use(
    bodyParser.urlencoded({
      limit: "512mb",
      type: "application/x-www-form-urlencoded",
      extended: false,
    })
  );

  app.get("/api/ui-context", function (req, res, next) {
    res.json({ version: engineVersion, eci: uiECI });
  });

  app.all("/c/:eci/event/:domain/:name", function (req, res, next) {
    pf.event({
      eci: req.params.eci,
      domain: req.params.domain,
      name: req.params.name,
      data: { attrs: mergeGetPost(req) },
      time: 0, // TODO remove this typescript requirement
    })
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/c/:eci/event-wait/:domain/:name", function (req, res, next) {
    pf.eventWait({
      eci: req.params.eci,
      domain: req.params.domain,
      name: req.params.name,
      data: { attrs: mergeGetPost(req) },
      time: 0, // TODO remove this typescript requirement
    })
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/sky/event/:eci/:eid/:domain/:type", function (req, res, next) {
    const attrs = mergeGetPost(req);
    if (req.params.eid !== "none" && !attrs.hasOwnProperty("__eid")) {
      attrs.__eid = req.params.eid;
    }
    pf.eventWait({
      eci: req.params.eci,
      domain: req.params.domain,
      name: req.params["type"],
      data: { attrs },
      time: 0, // TODO remove this typescript requirement
    })
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/c/:eci/event/:domain/:name/query/:rid/:qname", function (
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
        time: 0, // TODO remove this typescript requirement
      },
      {
        eci: req.params.eci,
        rid: req.params.rid,
        name: req.params.qname,
        args: attrs,
      }
    )
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/c/:eci/query/:rid/:name", function (req, res, next) {
    pf.query({
      eci: req.params.eci,
      rid: req.params.rid,
      name: req.params.name,
      args: mergeGetPost(req),
    })
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/sky/cloud/:eci/:rid/:function", function (req, res, next) {
    pf.query({
      eci: req.params.eci,
      rid: req.params.rid,
      name: req.params["function"],
      args: mergeGetPost(req),
    })
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.use(function (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    let message = err + "";
    console.error(err);
    res.json({ error: message });
  });

  return app;
}
