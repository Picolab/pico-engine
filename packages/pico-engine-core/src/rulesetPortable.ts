/**
 * Ruleset source policy for portable export/import (pico-move Phase B).
 * See docs/design/pico-move.md — inline KRL only when reference fetch fails.
 */

import * as crypto from "crypto";
import * as normalizeUrl from "normalize-url";

/** Basenames of engine-shipped rulesets (destination remaps via bundled krl/). */
const BUNDLED_KRL_BASENAMES = new Set([
  "io.picolabs.pico-engine-ui.krl",
  "io.picolabs.wrangler.krl",
  "io.picolabs.subscription.krl",
  "io.picolabs.pds.krl",
]);

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** Engine-shipped ruleset referenced by file: or https: /krl/ path. */
export function isEngineBundledRulesetUrl(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) {
    return false;
  }
  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    const match = parsed.pathname.match(/^\/krl\/(.+\.krl)$/);
    if (match && BUNDLED_KRL_BASENAMES.has(match[1].split("/").pop()!)) {
      return true;
    }
    return false;
  }
  if (parsed.protocol === "file:") {
    const pathname = decodeURIComponent(parsed.pathname);
    const basename = pathname.split("/").pop() || "";
    if (BUNDLED_KRL_BASENAMES.has(basename)) {
      return true;
    }
    if (/\/krl\/[^/]+\.krl$/.test(pathname)) {
      return true;
    }
  }
  return false;
}

/** Local file: URLs that are not engine-bundled need inline KRL in export packs. */
export function needsInlineKrlOnExport(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed || parsed.protocol !== "file:") {
    return false;
  }
  return !isEngineBundledRulesetUrl(url);
}

export function portableRulesetUrl(krl: string): string {
  const hash = crypto.createHash("sha256").update(krl).digest("hex");
  return `portable://${hash}`;
}

export function normalizeRulesetUrl(url: string): string {
  return normalizeUrl(url);
}
