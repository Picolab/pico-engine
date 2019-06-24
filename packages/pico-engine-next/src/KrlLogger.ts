import { LogLevelFn, mkLevel, stringifyPairs, timeFns } from "json-log";
import * as path from "path";

const rfs = require("rotating-file-stream");

const logStreams: { [filePath: string]: NodeJS.WritableStream } = {};
export function getRotatingFileStream(filePath: string): NodeJS.WritableStream {
  if (!logStreams[filePath]) {
    const filename = path.basename(filePath);
    logStreams[filePath] = rfs(
      (time: Date, index: number) => {
        if (!time) return filename;

        return filename + "." + index;
      },
      {
        path: path.dirname(filePath),

        size: "100M", // rotate every 10 MegaBytes written
        maxFiles: 12
      }
    ) as NodeJS.WritableStream;
  }
  return logStreams[filePath];
}

export class KrlLogger {
  private readonly ctx: string;
  private readonly fileStream: NodeJS.WritableStream;

  readonly error: LogLevelFn;
  readonly warn: LogLevelFn;
  readonly info: LogLevelFn;
  readonly klog: LogLevelFn;
  readonly debug: LogLevelFn;

  constructor(fileStream: NodeJS.WritableStream, ctx: string) {
    this.ctx = ctx;
    this.fileStream = fileStream;

    const isTest = process.env.NODE_ENV === "test";

    const write = (line: string) => {
      if (!isTest) {
        process.stdout.write(line);
      }
      this.fileStream.write(line);
    };

    this.error = mkLevel(10, timeFns.iso, ctx, write);
    this.warn = mkLevel(20, timeFns.iso, ctx, write);
    this.info = mkLevel(30, timeFns.iso, ctx, write);
    this.klog = mkLevel(40, timeFns.iso, ctx, write);
    this.debug = mkLevel(50, timeFns.iso, ctx, write);
  }

  child(moreCtx: any) {
    return new KrlLogger(this.fileStream, this.ctx + stringifyPairs(moreCtx));
  }
}
