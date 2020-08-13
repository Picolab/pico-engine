import * as path from "path";
import { toFileUrl } from "../../src/utils/toFileUrl";

const rsDir = path.resolve(__dirname, "../../../../test-rulesets");

export function toTestKrlURL(name: string): string {
  const fsPath = path.join(rsDir, name);
  return toFileUrl(fsPath);
}
