import { LogLevelFn, mkLevel, stringifyPairs, timeFns } from "json-log";
import * as path from "path";
import { WriteStream } from "fs";
const rfs = require("rotating-file-stream");

const logStreams: { [filePath: string]: WriteStream } = {};
function getStream(filePath: string): WriteStream {
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
    ) as WriteStream;
  }
  return logStreams[filePath];
}

export class KrlLogger {
  private readonly filePath: string;
  private readonly ctx: string;
  private readonly fileStream: WriteStream;

  readonly error: LogLevelFn;
  readonly warn: LogLevelFn;
  readonly info: LogLevelFn;
  readonly klog: LogLevelFn;
  readonly debug: LogLevelFn;

  constructor(filePath: string, ctx: string) {
    this.filePath = filePath;
    this.ctx = ctx;
    this.fileStream = getStream(filePath);

    const write = (line: string) => {
      process.stdout.write(line);
      this.fileStream.write(line);
    };

    this.error = mkLevel(10, timeFns.iso, ctx, write);
    this.warn = mkLevel(20, timeFns.iso, ctx, write);
    this.info = mkLevel(30, timeFns.iso, ctx, write);
    this.klog = mkLevel(40, timeFns.iso, ctx, write);
    this.debug = mkLevel(50, timeFns.iso, ctx, write);
  }

  child(moreCtx: any) {
    return new KrlLogger(this.filePath, this.ctx + stringifyPairs(moreCtx));
  }
}
