import { KrlCtx, makeKrlLogger } from "krl-stdlib";
import { PicoEngineCore } from "../../src/PicoEngineCore";
import { RulesetRegistryLoaderTesting } from "./RulesetRegistryLoaderTesting";
import { mkdb } from "./mkdb";

export default async function makeCoreAndKrlCtx(): Promise<{
  core: PicoEngineCore;
  krlCtx: KrlCtx;
}> {
  let krlCtx: any;
  let core = new PicoEngineCore({
    db: mkdb(),
    rsRegLoader: RulesetRegistryLoaderTesting({
      getKrlCtx: {
        rid: "getKrlCtx",
        init(rsCtx, mkCtx) {
          krlCtx = mkCtx(rsCtx);
          return {};
        },
      },
    }),
    log: makeKrlLogger((line: string) => null),
    async getPicoLogs(picoId) {
      return [];
    },
  });
  await core.start();
  const { ruleset } = await core.rsRegistry.flush("getKrlCtx");
  await core.picoFramework.rootPico.install(ruleset, {
    url: "getKrlCtx",
    config: {},
  });

  return { core, krlCtx };
}
