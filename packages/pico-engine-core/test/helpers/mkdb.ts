import { MemoryLevel } from "memory-level";
import { PicoDb, PicoDbKey } from "pico-framework";
const charwise = require("charwise");
const safeJsonCodec = require("level-json-coerce-null");

export function mkdb(): PicoDb {
  return new MemoryLevel<PicoDbKey, any>({
    keyEncoding: charwise,
    valueEncoding: safeJsonCodec,
  });
}
