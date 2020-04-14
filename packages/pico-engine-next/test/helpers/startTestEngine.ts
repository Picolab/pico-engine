import * as cuid from "cuid";
import * as path from "path";
import { ChannelConfig } from "pico-framework";
import { Pico } from "pico-framework/dist/src/Pico";
import * as tempDir from "temp-dir";
import { PicoEngineConfiguration, startEngine } from "../../src/index";
import { cleanDirectives } from "../../src/KrlCtx";
import { toTestKrlURL } from "./toTestKrlURL";

export const allowAllChannelConf: ChannelConfig = {
  tags: ["allow-all"],
  eventPolicy: {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  },
  queryPolicy: {
    allow: [{ rid: "*", name: "*" }],
    deny: [],
  },
};

export async function startTestEngine(
  testFiles: string[] = [],
  conf: PicoEngineConfiguration = {},
  home?: string // set same home if you want to reload state
) {
  const pe = await startEngine({
    ...conf,
    home: home || path.resolve(tempDir, "pico-engine", cuid()),
    port: 0,
  });

  const chann = await pe.pf.rootPico.newChannel(allowAllChannelConf);
  const eci = chann.id;

  async function installTestFile(pico: Pico, file: string) {
    const url = toTestKrlURL(file);
    const rs = await pe.rsRegistry.load(url);
    await pico.install(rs.ruleset, { url });
  }

  await Promise.all(
    testFiles.map(async (file) => {
      await installTestFile(pe.pf.rootPico, file);
    })
  );

  function mkSignal(eci: string) {
    return async function (
      domain: string,
      name: string,
      attrs: any = {},
      time: number = 0
    ) {
      const resp = await pe.pf.eventWait({
        eci,
        domain,
        name,
        data: { attrs },
        time,
      });
      return cleanDirectives(resp.responses);
    };
  }

  const signal = mkSignal(eci);

  function mkQuery(rid: string) {
    return function (name: string, args: any = {}) {
      return pe.pf.query({
        eci,
        rid,
        name,
        args,
      });
    };
  }

  return { pe, eci, signal, mkSignal, mkQuery, installTestFile };
}
