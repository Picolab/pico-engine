import * as fs from "fs";
import * as readline from "readline";
import { krlLogLevelCodeToHuman, PicoLogEntry } from "krl-stdlib";
import * as path from "path";

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
      },
    ) as NodeJS.WritableStream;
  }
  return logStreams[filePath];
}

export function makeRotatingFileLogWriter(
  filePath: string,
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
  picoId: string,
): Promise<PicoLogEntry[]> {
  const output: PicoLogEntry[] = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
  });

  for await (const line of rl) {
    // Each line in the readline input will be successively available here as
    // `line`.
    if (line.indexOf(picoId) < 0) {
      continue; // not my pico
    }
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (err) {}
    if (!entry || entry.picoId !== picoId) {
      continue; // not my pico
    }
    const time = new Date(entry.time);
    if (Date.now() - time.getTime() > 1000 * 60 * 60 * 12) {
      continue; // too old
    }

    const out: PicoLogEntry = {
      ...entry,
      level: krlLogLevelCodeToHuman[entry.level] || `${entry.level}`,
      time: entry.time,
      txnId: entry.txnId,
    };
    delete (out as any).picoId;
    output.push(out);
  }
  return output;
}
