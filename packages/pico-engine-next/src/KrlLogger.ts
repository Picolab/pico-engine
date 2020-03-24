import * as fs from "fs";
import { LogLevelFn, mkLevel, stringifyPairs, timeFns } from "json-log";
import * as path from "path";
const split = require("split");
const through2 = require("through2");

const rfs = require("rotating-file-stream");

const krlLogLevelCodeToHuman: { [level: string]: string } = {
  "10": "error",
  "20": "warn",
  "30": "info",
  "40": "klog",
  "50": "debug"
};

export interface PicoLogEntry {
  level: string;
  time: Date;
  txnId?: string;
}

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
  private readonly filePath?: string;

  readonly error: LogLevelFn;
  readonly warn: LogLevelFn;
  readonly info: LogLevelFn;
  readonly klog: LogLevelFn;
  readonly debug: LogLevelFn;

  constructor(
    fileStream: NodeJS.WritableStream,
    ctx: string,
    filePath?: string
  ) {
    this.ctx = ctx;
    this.fileStream = fileStream;
    this.filePath = filePath;

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
    return new KrlLogger(
      this.fileStream,
      this.ctx + stringifyPairs(moreCtx),
      this.filePath
    );
  }

  async getPicoLogs(picoId: string): Promise<PicoLogEntry[]> {
    if (this.filePath) {
      return getPicoLogs(this.filePath, picoId);
    }
    return [];
  }
}

async function getPicoLogs(
  filePath: string,
  picoId: string
): Promise<PicoLogEntry[]> {
  return new Promise((resolve, reject) => {
    const output: PicoLogEntry[] = [];
    fs.createReadStream(filePath)
      .pipe(split())
      .pipe(
        through2((chunk: any, enc: any, next: any) => {
          const line = chunk.toString();
          if (line.indexOf(picoId) < 0) {
            // not my pico
            return next();
          }
          let entry;
          try {
            entry = JSON.parse(line);
          } catch (err) {}
          if (!entry || entry.picoId !== picoId) {
            // not my pico
            return next();
          }
          const time = new Date(entry.time);
          if (Date.now() - time.getTime() > 1000 * 60 * 60 * 12) {
            // too old
            return next();
          }

          const out: PicoLogEntry = {
            ...entry,
            level: krlLogLevelCodeToHuman[entry.level] || `${entry.level}`,
            time: time,
            txnId: entry.txnId
          };
          delete (out as any).picoId;
          output.push(out);

          next();
        })
      )
      .on("finish", () => {
        resolve(output);
      })
      .on("error", (err: any) => {
        reject(err);
      });
  });
}
