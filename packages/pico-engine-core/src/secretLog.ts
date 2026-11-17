/**
 * Keep PDS secret setting values out of logs.
 * A settings record may carry `secret`: an array of data-key names. Those
 * data values are replaced with { secret: true, set }. An add_settings event
 * that names one of those keys, or sends secret: true, loses its `value`.
 * String values already stored as secrets are removed wherever they appear.
 */

export const SECRET_LOG_MASK = { secret: true, set: true };

const MIN_VALUE_MATCH = 8;

const keysByPico = new Map<string, Record<string, string[]>>();
const valuesByPico = new Map<string, Set<string>>();

function isNameList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function maskFor(value: unknown): { secret: true; set: boolean } {
  return { secret: true, set: value !== null && value !== undefined };
}

export function rememberPdsSettings(picoId: string, settings: unknown): void {
  const keys: Record<string, string[]> = {};
  const values = new Set<string>();
  if (settings && typeof settings === "object" && !Array.isArray(settings)) {
    for (const [rid, record] of Object.entries(settings as Record<string, unknown>)) {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        continue;
      }
      const rec = record as { secret?: unknown; data?: unknown };
      if (!isNameList(rec.secret)) {
        continue;
      }
      keys[rid] = rec.secret.slice();
      const data =
        rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)
          ? (rec.data as Record<string, unknown>)
          : {};
      for (const name of rec.secret) {
        const raw = data[name];
        if (typeof raw === "string" && raw.length >= MIN_VALUE_MATCH) {
          values.add(raw);
        }
      }
    }
  }
  keysByPico.set(picoId, keys);
  valuesByPico.set(picoId, values);
}

export function secretKeysFor(picoId: string, rid: string): string[] {
  return keysByPico.get(picoId)?.[rid] || [];
}

function knownSecretKey(rid: unknown, key: unknown): boolean {
  if (typeof rid !== "string" || typeof key !== "string") {
    return false;
  }
  for (const byRid of keysByPico.values()) {
    const list = byRid[rid];
    if (list && list.indexOf(key) !== -1) {
      return true;
    }
  }
  return false;
}

/** Load secret-key names already stored, so a later write is redacted before the rule runs. */
export async function warmPdsSecretLog(core: {
  picoFramework: {
    loadedPicos(): ReadonlyArray<{
      id: string;
      getEnt(rid: string, name: string): Promise<unknown>;
    }>;
  };
}): Promise<void> {
  for (const pico of core.picoFramework.loadedPicos()) {
    try {
      rememberPdsSettings(pico.id, await pico.getEnt("io.picolabs.pds", "settings"));
    } catch {
      // This pico does not have PDS installed.
    }
  }
}

function knownSecretString(value: unknown): boolean {
  if (typeof value !== "string" || value.length < MIN_VALUE_MATCH) {
    return false;
  }
  for (const set of valuesByPico.values()) {
    if (set.has(value)) {
      return true;
    }
  }
  return false;
}

export function redactSecretsForLog(value: unknown): unknown {
  return walk(value);
}

function walk(value: unknown): unknown {
  if (knownSecretString(value)) {
    return SECRET_LOG_MASK;
  }
  if (Array.isArray(value)) {
    return value.map(walk);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src)) {
    out[key] = walk(src[key]);
  }
  if (
    isNameList(src.secret) &&
    src.data &&
    typeof src.data === "object" &&
    !Array.isArray(src.data)
  ) {
    const data = { ...(out.data as Record<string, unknown>) };
    const rawData = src.data as Record<string, unknown>;
    for (const name of src.secret) {
      if (Object.prototype.hasOwnProperty.call(rawData, name)) {
        data[name] = maskFor(rawData[name]);
      }
    }
    out.data = data;
  }
  if (typeof src.data_key === "string" && Object.prototype.hasOwnProperty.call(src, "value")) {
    const marked =
      src.secret === true ||
      (isNameList(src.secret) && src.secret.indexOf(src.data_key) !== -1) ||
      knownSecretKey(src.keyed_rid, src.data_key);
    if (marked) {
      out.value = maskFor(src.value);
    }
  }
  return out;
}

function cloneForLog(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { _unloggable: true };
  }
}

/** A log copy of a queued transaction, with secret setting values removed. */
export function redactTxnForLog(picoId: string, txn: unknown): unknown {
  const copy = cloneForLog(txn) as {
    kind?: string;
    event?: { domain?: string; name?: string; data?: { attrs?: Record<string, unknown> } };
  };
  const attrs = copy && copy.kind === "event" && copy.event && copy.event.data && copy.event.data.attrs;
  if (
    copy &&
    copy.kind === "event" &&
    copy.event &&
    copy.event.domain === "pds" &&
    copy.event.name === "add_settings" &&
    attrs &&
    typeof attrs.data_key === "string" &&
    typeof attrs.keyed_rid === "string" &&
    secretKeysFor(picoId, attrs.keyed_rid).indexOf(attrs.data_key) !== -1
  ) {
    attrs.value = maskFor(attrs.value);
  }
  return redactSecretsForLog(copy);
}
