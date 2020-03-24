import * as fs from "fs";
import { krlLogLevelCodeToHuman } from "./KrlLogger";
var split = require("split");
var through2 = require("through2");

export interface PicoLogEntry {
  level: string;
  time: Date;
  txnId?: string;
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
