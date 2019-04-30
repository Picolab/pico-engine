import { LogLevelFn, mkLevel, stringifyPairs, timeFns } from "json-log";

export class KrlLogger {
  private readonly ctx: string;

  readonly error: LogLevelFn;
  readonly warn: LogLevelFn;
  readonly info: LogLevelFn;
  readonly klog: LogLevelFn;
  readonly debug: LogLevelFn;

  constructor(ctx: string) {
    this.ctx = ctx;

    function write(line: string) {
      process.stdout.write(line);
      // TODO also write to log_file
    }

    this.error = mkLevel("error", timeFns.iso, ctx, write);
    this.warn = mkLevel("warn", timeFns.iso, ctx, write);
    this.info = mkLevel("info", timeFns.iso, ctx, write);
    this.klog = mkLevel("klog", timeFns.iso, ctx, write);
    this.debug = mkLevel("debug", timeFns.iso, ctx, write);
  }

  child(moreCtx: any) {
    return new KrlLogger(this.ctx + stringifyPairs(moreCtx));
  }
}
