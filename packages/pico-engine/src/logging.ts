import * as fs from "fs";
import { krlLogLevelCodeToHuman, PicoLogEntry } from "krl-stdlib";
import * as path from "path";
const split = require("split");
const through2 = require("through2");

const rfs = require("rotating-file-stream");

const logStreams: { [filePath: string]: NodeJS.WritableStream } = {};
function getRotatingFileStream(filePath: string): NodeJS.WritableStream {
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
        maxFiles: 12,
      }
    ) as NodeJS.WritableStream;
  }
  return logStreams[filePath];
}

export function makeRotatingFileLogWriter(
  filePath: string
): (line: string) => void {
  const fileStream = getRotatingFileStream(filePath);
  const isTest = process.env.NODE_ENV === "test";

  function write(line: string) {
    if (!isTest) {
      process.stdout.write(line);
    }
    fileStream.write(line);
  }

  return write;
}

export async function getPicoLogs(
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
            time: entry.time,
            txnId: entry.txnId,
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
