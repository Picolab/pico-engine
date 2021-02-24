import * as bodyParser from "body-parser";
import * as express from "express";
import { Express, Request } from "express";
import * as helmet from "helmet";
import * as _ from "lodash";
import * as path from "path";
import { PicoEngineCore } from "pico-engine-core";

const engineVersion = require("../package.json").version;

function mergeGetPost(req: Request) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers });
}

export function server(core: PicoEngineCore, uiECI: string): Express {
  const app = express();

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  app.use('*',(req,res,next) =>{
    if (req.method == "OPTIONS") {
      res.header("Allow", "POST, GET, OPTIONS");
      res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.status(200);
      res.send();
    }else{
      next();
    }
  });
  app.use(helmet());
  app.use(express.static(path.resolve(__dirname, "..", "public")));
  app.use(
    bodyParser.json({
      type: [
        "application/json",
        "application/octet-stream",
        "application/ssi-agent-wire",
      ],
    })
  );
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

  app.all("/api/flush", function (req, res, next) {
    const attrs = mergeGetPost(req);
    const url = attrs["url"];
    if (typeof url !== "string") {
      next(new TypeError("Expected `url`"));
    } else {
      core.rsRegistry
        .flush(url)
        .then((rs) => {
          res.json({
            url: rs.url,
            rid: rs.rid,
            hash: rs.hash,
            flushed: rs.flushed,
            compiler: rs.compiler,
          });
        })
        .catch(next);
    }
  });

  app.all("/c/:eci/event/:domain/:name", function (req, res, next) {
    core
      .event({
        eci: req.params.eci,
        domain: req.params.domain,
        name: req.params.name,
        data: { attrs: mergeGetPost(req) },
        time: 0, // TODO remove this typescript requirement
      })
      .then((eid) => {
        res.json(eid);
      })
      .catch(next);
  });

  app.all("/c/:eci/event-wait/:domain/:name", function (req, res, next) {
    core
      .eventWait({
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
    core
      .eventWait({
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

  app.all(
    "/c/:eci/event/:domain/:name/query/:rid/:qname",
    function (req, res, next) {
      const attrs = mergeGetPost(req);
      core
        .eventQuery(
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
    }
  );

  app.all("/c/:eci/query/:rid/:name", function (req, res, next) {
    core
      .query({
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
    const funcPart = req.params["function"].split(".");
    core
      .query({
        eci: req.params.eci,
        rid: req.params.rid,
        name: funcPart[0],
        args: mergeGetPost(req),
      })
      .then((data) => {
        if (funcPart[1] === "html") {
          res.header("Content-Type", "text/html");
          res.end(data);
        } else if (funcPart[1] === "txt") {
          res.header("Content-Type", "text/plain");
          res.end(data);
        } else {
          res.json(data);
        }
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
    if (err?.krl_compiler?.loc?.start) {
      message +=
        " [at line " +
        err.krl_compiler.loc.start.line +
        " col " +
        err.krl_compiler.loc.start.column;
      if (
        err.krl_compiler.loc.end &&
        err.krl_compiler.loc.end.line !== err.krl_compiler.loc.start.line
      ) {
        message +=
          " to line " +
          err.krl_compiler.loc.end.line +
          " col " +
          err.krl_compiler.loc.end.column;
      }
      message += "]";
    } else if (err?.where?.filename) {
      message += ` [at line ${err.where.line} col ${err.where.col}]`;
    }
    res.json({ error: message });
  });

  return app;
}
