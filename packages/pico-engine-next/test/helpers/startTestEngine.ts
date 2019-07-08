import * as cuid from "cuid";
import * as path from "path";
import * as tempDir from "temp-dir";
import { startEngine, PicoEngineConfiguration } from "../../src/index";
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

  return { pe, eci };
}
