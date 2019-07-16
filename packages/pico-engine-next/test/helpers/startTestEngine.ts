import * as cuid from "cuid";
import * as path from "path";
import * as tempDir from "temp-dir";
import { PicoEngineConfiguration, startEngine } from "../../src/index";
import { cleanDirectives } from "../../src/KrlCtx";
import { readTestKrl } from "./readTestKrl";

export async function startTestEngine(
  testFiles: string[] = [],
  conf?: PicoEngineConfiguration
) {
  const pe = await startEngine(
    Object.assign({}, conf || {}, {
      home: path.resolve(tempDir, "pico-engine", cuid()),
      port: 0
    })
  );

  const chann = await pe.pf.rootPico.newChannel({
    tags: ["allow-all"],
    eventPolicy: {
      allow: [{ domain: "*", name: "*" }],
      deny: []
    },
    queryPolicy: {
      allow: [{ rid: "*", name: "*" }],
      deny: []
    }
  });
  const eci = chann.id;

  await Promise.all(
    testFiles.map(async file => {
      const krl = await readTestKrl(file);
      const { rid, version } = await pe.rsRegistry.publish(krl);
      await pe.pf.rootPico.install(rid, version);
    })
  );

  async function signal(
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
      time
    });
    return cleanDirectives(resp.responses);
  }

  function mkQuery(rid: string) {
    return function(name: string, args: any = {}) {
      return pe.pf.query({
        eci,
        rid,
        name,
        args
      });
    };
  }

  return { pe, eci, signal, mkQuery };
}
