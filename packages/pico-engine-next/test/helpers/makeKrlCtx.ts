import { PicoFramework, Ruleset } from "pico-framework";
import { PassThrough } from "stream";
import { KrlCtx, RulesetEnvironment } from "../../src/KrlCtx";
import { KrlLogger } from "../../src/KrlLogger";
import { RulesetRegistry } from "../../src/RulesetRegistry";
import { RulesetRegistryLoaderMem } from "../../src/RulesetRegistryLoaderMem";

export async function makeKrlCtx(onLogLine?: (str: string) => void) {
  let krlCtx: KrlCtx | undefined;

  const logStream = new PassThrough();
  const log = new KrlLogger(logStream, "");
  const rsRegistry = new RulesetRegistry(
    RulesetRegistryLoaderMem(async url => "")
  );
  const environment = new RulesetEnvironment(log, rsRegistry);

  const pf = new PicoFramework({
    rulesetLoader: rsRegistry.loader,
    environment
  });
  const tstCtxRs: Ruleset = {
    rid: "rs.to.get.ctx",
    version: "0.0.0",
    async init(rsCtx) {
      krlCtx = environment.mkCtx(rsCtx);
      return {};
    }
  };
  await pf.start();
  await pf.rootPico.install(tstCtxRs);
  if (!krlCtx) {
    throw new Error("KRL ctx was not initialized");
  }

  if (onLogLine) {
    logStream.on("data", data => {
      onLogLine(data.toString());
    });
  }

  return krlCtx;
}
