/**
 * Shared integration helper: engine, query/signal shortcuts, optional test
 * rulesets.
 */

import { ChannelConfig, Pico, PicoFramework } from "pico-framework";
import { PicoEngineConfiguration } from "../../src/index";
import { cleanDirectives } from "./cleanDirectives";
import { startIsolatedEngine } from "./isolatedEngine";
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
  const pe = await startIsolatedEngine({
    ...conf,
    autoCreateRootPico: conf.autoCreateRootPico ?? true,
  });

  const root = pe.pf.rootPicos()[0];
  if (!root) {
    throw new Error("startTestEngine expected a root pico (autoCreateRootPico)");
  }
  const chann = await root.newChannel(allowAllChannelConf);
  const eci = chann.id;

  async function installTestFile(pico: Pico, file: string) {
    const url = toTestKrlURL(file);
    const rs = await pe.rsRegistry.load(url);
    await pico.install(rs.ruleset, { url });
  }

  // order matters
  for (const file of testFiles) {
    await installTestFile(root, file);
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
