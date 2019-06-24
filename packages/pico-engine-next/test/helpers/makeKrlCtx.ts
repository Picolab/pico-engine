import { PicoFramework } from "pico-framework";
import { PassThrough } from "stream";
import { KrlCtx, RulesetEnvironment } from "../../src/KrlCtx";
import { KrlLogger } from "../../src/KrlLogger";

export async function makeKrlCtx(onLine?: (str: string) => void) {
  let krlCtx: KrlCtx | undefined;

  const logStream = new PassThrough();
  const log = new KrlLogger(logStream, "");
  const environment = new RulesetEnvironment(log);

  const pf = new PicoFramework({ environment });
  pf.addRuleset({
    rid: "rs.to.get.ctx",
    version: "0.0.0",
    async init(rsCtx) {
      krlCtx = environment.mkCtx(rsCtx);
      return {};
    }
  });
  await pf.start();
  await pf.rootPico.install("rs.to.get.ctx", "0.0.0");
  if (!krlCtx) {
    throw new Error("KRL ctx was not initialized");
  }

  if (onLine) {
    logStream.on("data", data => {
      onLine(data.toString());
    });
  }

  return krlCtx;
}
