const STORAGE_PREFIX = "pico-engine-ui:off-engine-pos:";

export type OffEnginePosition = { x: number; y: number };

export function loadOffEnginePosition(
  rootEci: string
): OffEnginePosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + rootEci);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as OffEnginePosition;
    if (
      typeof parsed?.x === "number" &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveOffEnginePosition(
  rootEci: string,
  position: OffEnginePosition
): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + rootEci, JSON.stringify(position));
  } catch {
    // ignore quota / private mode
  }
}
