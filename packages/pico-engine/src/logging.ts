import * as fs from "fs";
import * as readline from "readline";
import { krlLogLevelCodeToHuman, PicoLogEntry } from "krl-stdlib";
import * as path from "path";
import { getEngineRuntimeSettings } from "./engineConfig";

const rfs = require("rotating-file-stream");

const logStreams: { [filePath: string]: NodeJS.WritableStream } = {};

/** Last N transactions per pico kept for the Logging tab. A restart clears this. */
const DEFAULT_LOG_RING = 200;

interface PicoLogRing {
  order: string[];
  txns: Map<string, PicoLogEntry[]>;
}

const picoLogRings = new Map<string, PicoLogRing>();

export type PicoLogListener = (picoId: string, txnId: string) => void;

const picoLogListeners = new Set<PicoLogListener>();

/** Fires when a transaction on a pico finishes (`txnDone` or `txnError`). */
export function subscribePicoLogRing(listener: PicoLogListener): () => void {
  picoLogListeners.add(listener);
  return () => {
    picoLogListeners.delete(listener);
  };
}

function notifyPicoLog(picoId: string, txnId: string): void {
  for (const listener of [...picoLogListeners]) {
    try {
      listener(picoId, txnId);
    } catch {
      // One client must not stop the log writer or the other clients.
    }
  }
}

export function picoLogRingLimit(): number {
  const raw = process.env.PICO_ENGINE_LOG_RING;
  if (raw == null || raw.trim() === "") return DEFAULT_LOG_RING;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LOG_RING;
  return Math.min(Math.floor(n), 10000);
}

export function clearPicoLogRing(): void {
  picoLogRings.clear();
  picoLogListeners.clear();
}

/**
 * Keep one structured log line for the Logging tab. Lines without a pico and
 * a transaction are ignored. The oldest transaction for that pico is dropped
 * once the ring is full.
 */
export function rememberPicoLogLine(
  line: string,
  limit = picoLogRingLimit()
): void {
  const trimmed = line.trim();
  if (!trimmed || trimmed[0] !== "{") return;
  let entry: any;
  try {
    entry = JSON.parse(trimmed);
  } catch {
    return;
  }
  if (
    !entry ||
    typeof entry.picoId !== "string" ||
    entry.picoId === "" ||
    typeof entry.txnId !== "string" ||
    entry.txnId === ""
  ) {
    return;
  }
  const picoId = entry.picoId as string;
  const txnId = entry.txnId as string;
  let ring = picoLogRings.get(picoId);
  if (!ring) {
    ring = { order: [], txns: new Map() };
    picoLogRings.set(picoId, ring);
  }
  let lines = ring.txns.get(txnId);
  if (!lines) {
    lines = [];
    ring.txns.set(txnId, lines);
    ring.order.push(txnId);
    while (ring.order.length > limit) {
      const drop = ring.order.shift();
      if (drop) ring.txns.delete(drop);
    }
  }
  const stored: PicoLogEntry = {
    ...entry,
    level: krlLogLevelCodeToHuman[String(entry.level)] || `${entry.level}`,
    time: entry.time,
    txnId,
  };
  delete (stored as { picoId?: string }).picoId;
  lines.push(stored);
  if (entry.msg === "txnDone" || entry.msg === "txnError") {
    notifyPicoLog(picoId, txnId);
  }
}

/** Recent log lines for one pico, oldest transaction first. */
export function picoLogEntries(picoId: string): PicoLogEntry[] {
  const ring = picoLogRings.get(picoId);
  if (!ring) return [];
  const output: PicoLogEntry[] = [];
  for (const txnId of ring.order) {
    const lines = ring.txns.get(txnId);
    if (lines) output.push(...lines);
  }
  return output;
}

function tapLogRing(write: (line: string) => void): (line: string) => void {
  return (line: string) => {
    rememberPicoLogLine(line);
    write(line);
  };
}

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

/**
 * Primary log sink: file path when logging to a file, or null when operator chose
 * stdout-only (`logToStdout` / `PICO_ENGINE_LOG_FILE=stdout`).
 */
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

/**
 * Operator log file. The Logging tab reads the in-memory ring, not this file.
 * When stdout-only, mirrors to `$PICO_ENGINE_HOME/pico-engine.log` unless
 * `logMirror` is false (config `logMirror`, or `PICO_ENGINE_LOG_MIRROR=0`).
 */
export function resolvePicoLogsReadPath(home: string): string | null {
  const settings = getEngineRuntimeSettings();
  if (settings.logToStdout) {
    if (settings.logMirror === false) {
      return null;
    }
    return path.resolve(home, "pico-engine.log");
  }
  if (settings.logFile) {
    return settings.logFile;
  }
  return path.resolve(home, "pico-engine.log");
}

export function makeEngineLogWriter(
  filePath: string | null,
  home: string
): (line: string) => void {
  if (filePath) {
    return tapLogRing(makeRotatingFileLogWriter(filePath));
  }
  const mirrorPath = resolvePicoLogsReadPath(home);
  if (!mirrorPath) {
    return tapLogRing(stdoutOnlyLogWriter());
  }
  const fileStream = getRotatingFileStream(mirrorPath);
  const isTest = process.env.NODE_ENV === "test";
  return tapLogRing((line: string) => {
    if (!isTest) {
      process.stdout.write(line);
    }
    fileStream.write(line, (err?: Error | null) => {
      if (err) {
        process.stderr.write(
          `pico-engine log file write failed (${mirrorPath}): ${err.message}\n`
        );
      }
    });
  });
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
