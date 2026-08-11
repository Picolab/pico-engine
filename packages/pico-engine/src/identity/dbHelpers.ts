import { PicoDb, PicoDbKey } from "pico-framework";

export async function dbGet<T>(db: PicoDb, key: PicoDbKey): Promise<T | null> {
  try {
    const value = await db.get(key);
    return value === undefined ? null : (value as T);
  } catch (err: any) {
    if (err && (err.notFound || err.code === "LEVEL_NOT_FOUND")) {
      return null;
    }
    throw err;
  }
}

export async function dbPut(
  db: PicoDb,
  key: PicoDbKey,
  value: unknown
): Promise<void> {
  if (value === undefined || value === null) {
    await db.del(key);
    return;
  }
  await db.put(key, value);
}

export async function dbDel(db: PicoDb, key: PicoDbKey): Promise<void> {
  try {
    await db.del(key);
  } catch (err: any) {
    if (err && (err.notFound || err.code === "LEVEL_NOT_FOUND")) {
      return;
    }
    throw err;
  }
}

export async function dbList<T = unknown>(
  db: PicoDb,
  prefix: PicoDbKey
): Promise<{ key: PicoDbKey; value: T }[]> {
  const out: { key: PicoDbKey; value: T }[] = [];
  const iter = db.iterator({
    gte: prefix,
    lte: prefix.concat([undefined] as any),
  });
  for await (const [key, value] of iter) {
    out.push({ key, value: value as T });
  }
  return out;
}
