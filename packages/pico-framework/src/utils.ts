import { AbstractLevel, AbstractBatchOperation } from "abstract-level";

export function isNotStringOrBlank(val: any) {
  return typeof val !== "string" || val.trim().length === 0;
}

export type PicoDbKey = (string | number | null | boolean)[];
export type PicoDb = AbstractLevel<any, PicoDbKey, any>;
export type LevelBatch = AbstractBatchOperation<PicoDb, PicoDbKey, any>;
