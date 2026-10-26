import * as fs from "fs";
import * as readline from "readline";
import { krlLogLevelCodeToHuman, PicoLogEntry } from "krl-stdlib";
import * as path from "path";
import { getEngineRuntimeSettings } from "./engineConfig";

const rfs = require("rotating-file-stream");

const logStreams: { [filePath: string]: NodeJS.WritableStream } = {};

function stdoutOnlyLogWriter(): (line: string) => void {
  const isTest = process.env.NODE_ENV === "test";
  return (line: string) => {
    if (!isTest) {
      process.stdout.write(line);
    }
  };
}

function attachSafeLogStreamHandlers(
  fileStream: NodeJS.WritableStream,
  filePath: string
): void {
  fileStream.on("error", (err: Error) => {
    process.stderr.write(
      `pico-engine log file write failed (${filePath}): ${err.message}\n`
    );
  });
}

function getRotatingFileStream(filePath: string): NodeJS.WritableStream {
  if (!logStreams[filePath]) {
    const filename = path.basename(filePath);
    const fileStream = rfs(
      (time: Date, index: number) => {
        if (!time) return filename;

        return filename + "." + index;
      },
      {
        path: path.dirname(filePath),

        size: "100M", // rotate every 100 MegaBytes written
        maxFiles: 12,
      }
    ) as NodeJS.WritableStream;
    attachSafeLogStreamHandlers(fileStream, filePath);
    logStreams[filePath] = fileStream;
  }
  return logStreams[filePath];
}

export function resolveEngineLogFilePath(home: string): string | null {
  const settings = getEngineRuntimeSettings();
  if (settings.logToStdout) {
    return null;
  }
  if (settings.logFile) {
    return settings.logFile;
  }
  return path.resolve(home, "pico-engine.log");
}

export function makeEngineLogWriter(
  filePath: string | null
): (line: string) => void {
  if (!filePath) {
    return stdoutOnlyLogWriter();
  }
  return makeRotatingFileLogWriter(filePath);
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
    fileStream.write(line, (err?: Error | null) => {
      if (err) {
        process.stderr.write(
          `pico-engine log file write failed (${filePath}): ${err.message}\n`
        );
      }
    });
  }

  return write;
}

export async function getPicoLogs(
  filePath: string,
  picoId: string
): Promise<PicoLogEntry[]> {
  const output: PicoLogEntry[] = [];

  if (!(await fs.promises.stat(filePath).catch(() => null))) {
    return output;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
  });

  for await (const line of rl) {
    if (line.indexOf(picoId) < 0) {
      continue;
    }
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (err) {}
    if (!entry || entry.picoId !== picoId) {
      continue;
    }
    const time = new Date(entry.time);
    if (Date.now() - time.getTime() > 1000 * 60 * 60 * 12) {
      continue;
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
