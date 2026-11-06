import * as path from "path";
import { toFileUrl } from "../../src/utils/toFileUrl";

const demoDir = path.resolve(__dirname, "../../../../demos/xmlui");

export function toDemoXmluiKrlURL(name: string): string {
  return toFileUrl(path.join(demoDir, name));
}
