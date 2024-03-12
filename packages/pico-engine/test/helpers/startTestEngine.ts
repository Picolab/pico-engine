import * as cuid from "cuid";
import * as path from "path";
import { ChannelConfig, Pico, PicoFramework } from "pico-framework";
import * as os from "os";
import { PicoEngineConfiguration, startEngine } from "../../src/index";
import { cleanDirectives } from "./cleanDirectives";
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

export function mkSignalBase(pf: PicoFramework) {
  return function (eci: string) {
    return async function (
      domain: string,
      name: string,
      attrs: any = {},
      time: number = 0
    ) {
      const resp = await pf.eventWait({
        eci,
        domain,
        name,
        data: { attrs },
        time,
      });
      return cleanDirectives(resp.responses);
    };
  };
}

export async function startTestEngine(
  testFiles: string[] = [],
  conf: PicoEngineConfiguration = {}
) {
  const pe = await startEngine({
    ...conf,
    home: conf.home || path.resolve(os.tmpdir(), "pico-engine", cuid()),
    port: 0,
  });

  const chann = await pe.pf.rootPico.newChannel(allowAllChannelConf);
  const eci = chann.id;

  async function installTestFile(pico: Pico, file: string) {
    const url = toTestKrlURL(file);
    const rs = await pe.rsRegistry.load(url);
    await pico.install(rs.ruleset, { url });
  }

  // order matters
  for (const file of testFiles) {
    await installTestFile(pe.pf.rootPico, file);
  }

  const mkSignal = mkSignalBase(pe.pf);
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
