import { KrlCtx, makeKrlLogger } from "krl-stdlib";
import { PicoFramework, Ruleset } from "pico-framework";
import { RulesetEnvironment } from "../../src/KrlCtx";
import { RulesetRegistry } from "../../src/RulesetRegistry";
import { RulesetRegistryLoaderMem } from "../../src/RulesetRegistryLoaderMem";

export async function makeKrlCtx(onLogLine?: (str: string) => void) {
  let krlCtx: KrlCtx | undefined;

  const log = makeKrlLogger(onLogLine || ((line: string) => null));
  const rsRegistry = new RulesetRegistry(
    RulesetRegistryLoaderMem(async (url) => "")
  );
  const environment = new RulesetEnvironment(log, rsRegistry, async () => []);

  const pf = new PicoFramework({
    rulesetLoader: rsRegistry.loader,
    environment,
  });
  const tstCtxRs: Ruleset = {
    rid: "rs.to.get.ctx",
    version: "0.0.0",
    async init(rsCtx) {
      krlCtx = environment.mkCtx(rsCtx);
      return {};
    },
  };
  await pf.start();
  await pf.rootPico.install(tstCtxRs, { url: "tstCtxRs" });
  if (!krlCtx) {
    throw new Error("KRL ctx was not initialized");
  }

  return krlCtx;
}
