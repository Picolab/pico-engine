const { xmluiBuiltins } = require("krl-compiler");

export function isXmluiBuiltin(componentName: string): boolean {
  return xmluiBuiltins.isBuiltin(componentName);
}

/** Pinned XMLUI standalone runtime shipped under `public/xmlui/`. */
export const XMLUI_RUNTIME_VERSION = "0.14.28";

export const XMLUI_RUNTIME_PUBLIC_PATH = `/xmlui/${XMLUI_RUNTIME_VERSION}.js`;

/** XMLUI standalone always requests Main.xmlui.xs (and per-component .xmlui.xs). */
export const XMLUI_EMPTY_CODE_BEHIND = "var __pico_xmlui_codebehind = 0;\n";

export function isXmluiCodeBehindPath(relPath: string): boolean {
  if (relPath === "Main.xmlui.xs") return true;
  return /^components\/.+\.xmlui\.xs$/i.test(relPath);
}

/** Map a shared function name to the XMLUI component file name (Hello, ColorView, …). */
export function viewComponentFileName(fnName: string): string {
  if (!fnName) return fnName;
  return fnName.charAt(0).toUpperCase() + fnName.slice(1);
}

export function parseComponentXmluiPath(relPath: string): string | null {
  const m = /^components\/(.+)\.xmlui$/i.exec(relPath);
  return m ? m[1] : null;
}

/** Client route segment (e.g. list, contact/abc) — not a static XMLUI asset. */
export function isXmluiSpaClientRoute(relPath: string): boolean {
  const rel = relPath.replace(/^\/+/, "");
  if (!rel || rel === "index.html") return false;
  if (rel === "Main.xmlui" || rel === "config.json") return false;
  if (isXmluiCodeBehindPath(rel)) return false;
  if (parseComponentXmluiPath(rel)) return false;
  const lastSegment = rel.split("/").pop() || "";
  if (lastSegment.includes(".")) return false;
  return true;
}

export interface ChannelSchemaQuery {
  rid: string;
  name: string;
  view?: unknown;
  component?: unknown;
}

export const XMLUI_RID = "io.picolabs.xmlui";

/**
 * The query that answers components/<componentName>.xmlui on a channel:
 * the app ruleset's @view or @component, then io.picolabs.xmlui's
 * @component, then the one other ruleset's @component. Two other rulesets
 * with the same component name, or a built-in XMLUI name, answer nothing.
 */
export function queryForComponentFile(
  queries: ChannelSchemaQuery[] | undefined,
  appRid: string,
  componentName: string
): { rid: string; name: string } | null {
  if (!queries?.length || isXmluiBuiltin(componentName)) return null;
  const named = queries.filter(
    (q) => viewComponentFileName(q.name) === componentName
  );
  const fromApp = named.find(
    (q) => q.rid === appRid && (q.view != null || q.component != null)
  );
  if (fromApp) return { rid: fromApp.rid, name: fromApp.name };
  const components = named.filter(
    (q) => q.rid !== appRid && q.component != null
  );
  const fromXmlui = components.find((q) => q.rid === XMLUI_RID);
  if (fromXmlui) return { rid: fromXmlui.rid, name: fromXmlui.name };
  const others = components.filter((q) => q.rid !== XMLUI_RID);
  if (others.length !== 1) return null;
  return { rid: others[0].rid, name: others[0].name };
}

export function contentTypeForUiPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".html")) return "text/html; charset=utf-8";
  if (lower.endsWith(".xmlui")) return "application/xml; charset=utf-8";
  if (lower.endsWith(".xs")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  return "text/plain; charset=utf-8";
}
