const leveldown = require("leveldown");
import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import * as _ from "lodash";
import { PicoFramework } from "pico-framework";
import { Request } from "express";

const engineVersion = require("../package.json").version;

// import * as helmet from "helmet";

function mergeGetPost(req: Request) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers });
}

interface PicoEngineConf {
  home: string;
  port: number;
  base_url: string;
  log_path: string;
}

async function main(conf: PicoEngineConf) {
  const pf = new PicoFramework({
    leveldown: leveldown(path.join(conf.home, "db"))
  });
  await pf.start();

  console.log(`Pico Engine ${engineVersion}`);
  console.log(conf);

  const app = express();
  app.use(express.static(path.resolve(__dirname, "..", "public")));
  app.use(bodyParser.json({ type: "application/json" }));
  app.use(
    bodyParser.urlencoded({
      limit: "512mb",
      type: "application/x-www-form-urlencoded",
      extended: false
    })
  );

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

  // app.all('/c/:eci/query/:rid/:name', function (req, res, next) {
  // })

  app.listen(conf.port);
}

main({
  home: __dirname,
  port: 2020,
  base_url: "http://localhost:2020",
  log_path: path.resolve(__dirname, "pico-engine.log")
});
