import * as fs from "fs";
import * as path from "path";

const rsDir = path.resolve(__dirname, "../../../test-rulesets");

export function readTestKrl(name: string): Promise<string> {
  const fsPath = path.join(rsDir, name);
  return new Promise((resolve, reject) => {
    fs.readFile(fsPath, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
