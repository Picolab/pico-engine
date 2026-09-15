import { ClassicLevel } from "classic-level";
import * as fs from "fs/promises";
import * as makeDir from "make-dir";
import * as path from "path";
import type { KrlLogger } from "krl-stdlib";

export type ClassicLevelOptions = ConstructorParameters<typeof ClassicLevel>[1];

function errCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export function isLevelDbOpenError(err: unknown): boolean {
  const code = errCode(err);
  if (code === "LEVEL_LOCKED") {
    return true;
  }
  const message = errMessage(err);
  return /LOCK|corrupt|IO error|database/i.test(message);
}

async function removeStaleLockFile(
  location: string,
  log?: KrlLogger
): Promise<void> {
  const lockPath = path.join(location, "LOCK");
  try {
    await fs.unlink(lockPath);
    log?.info("Removed stale LevelDB LOCK file", { location });
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      throw err;
    }
  }
}

async function closeClassicLevelQuietly(
  db: ClassicLevel<any, any>
): Promise<void> {
  try {
    await db.close();
  } catch {
    // May never have opened.
  }
}

async function openOnce<K = any, V = any>(
  location: string,
  options?: ClassicLevelOptions
): Promise<ClassicLevel<K, V>> {
  const db = new ClassicLevel<K, V>(
    location,
    options as ConstructorParameters<typeof ClassicLevel<K, V>>[1]
  );
  try {
    await db.open();
    return db;
  } catch (err) {
    // A failed open can still leave a handle; if it is GC'd later it closes
    // the underlying store and breaks a subsequent successful open on the same path.
    await closeClassicLevelQuietly(db);
    throw err;
  }
}

/**
 * Open a ClassicLevel database, recovering from stale locks or minor corruption
 * left by an unclean shutdown (e.g. container SIGKILL).
 *
 * Recovery order (non-destructive first):
 * 1. Normal open
 * 2. Remove stale LOCK and retry
 * 3. LevelDB repair and retry
 */
export async function openClassicLevelWithRecovery<K = any, V = any>(
  location: string,
  options?: ClassicLevelOptions,
  log?: KrlLogger
): Promise<ClassicLevel<K, V>> {
  await makeDir(location);

  try {
    return await openOnce(location, options);
  } catch (firstErr) {
    if (!isLevelDbOpenError(firstErr)) {
      throw firstErr;
    }
    log?.warn("LevelDB open failed; attempting recovery", {
      location,
      error: firstErr,
    });
  }

  await removeStaleLockFile(location, log);
  try {
    return await openOnce(location, options);
  } catch (secondErr) {
    if (!isLevelDbOpenError(secondErr)) {
      throw secondErr;
    }
    log?.warn("LevelDB open failed after lock cleanup; running repair", {
      location,
      error: secondErr,
    });
  }

  await ClassicLevel.repair(location);
  log?.info("LevelDB repair finished", { location });

  return openOnce(location, options);
}
