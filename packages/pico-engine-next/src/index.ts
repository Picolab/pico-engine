import { PicoFramework } from "pico-framework";
import { inputToConf, PicoEngineSettings } from "./configuration";
import { server } from "./server";
const leveldown = require("leveldown");

export async function startEngine(settings?: PicoEngineSettings) {
  const conf = inputToConf(settings);

  const pf = new PicoFramework({
    leveldown: leveldown(conf.db_path)
  });
  await pf.start();

  console.log(`Starting pico-engine-NEXT ${conf.version}`);
  console.log(conf);

  const app = server(pf, conf);
  await new Promise((resolve, reject) =>
    app.listen(conf.port, (err: any) => (err ? reject(err) : resolve()))
  );

  console.log(`Listening on ${conf.base_url}`);

  // TODO  pf.event ... engine:started
}
