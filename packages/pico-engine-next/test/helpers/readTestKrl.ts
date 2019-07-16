import * as fs from "fs";
import * as path from "path";

const rsDir = path.resolve(__dirname, "../../../../test-rulesets");
const cache: { [fsPath: string]: Promise<string> } = {};

export function readTestKrl(name: string): Promise<string> {
  const fsPath = path.join(rsDir, name);
  if (!cache[fsPath]) {
    cache[fsPath] = new Promise((resolve, reject) => {
      fs.readFile(fsPath, "utf8", (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
  return cache[fsPath];
}
