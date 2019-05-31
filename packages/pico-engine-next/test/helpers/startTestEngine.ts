import * as cuid from "cuid";
import * as path from "path";
import * as tempDir from "temp-dir";
import { startEngine } from "../../src/index";

export function startTestEngine() {
  return startEngine({
    home: path.resolve(tempDir, "pico-engine", cuid()),
    port: 0
  });
}
