import { LogLevelFn, mkLevel, stringifyPairs, timeFns } from "json-log";

export interface KrlLogger {
  readonly error: LogLevelFn;
  readonly warn: LogLevelFn;
  readonly info: LogLevelFn;
  readonly klog: LogLevelFn;
  readonly debug: LogLevelFn;

  child(moreCtx: any): KrlLogger;
}

export function makeKrlLogger(
  write: (line: string) => void,
  baseCtx: any = {}
) {
  const ctx = stringifyPairs(baseCtx);

  return {
    error: mkLevel(10, timeFns.iso, ctx, write),
    warn: mkLevel(20, timeFns.iso, ctx, write),
    info: mkLevel(30, timeFns.iso, ctx, write),
    klog: mkLevel(40, timeFns.iso, ctx, write),
    debug: mkLevel(50, timeFns.iso, ctx, write),

    child(moreCtx: any) {
      return makeKrlLogger(write, ctx + stringifyPairs(moreCtx));
    },
  };
}
