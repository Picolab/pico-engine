/** Deep-link from Docs "Try it" into the Testing tab (U7). */

export interface TestingTryParams {
  rid: string;
  /** Annotated rule (event operation). */
  rule?: string;
  /** Shared query name. */
  query?: string;
  /** `@example` name for rule or query. */
  example?: string;
}

export function parseTestingTryParams(
  search: string
): TestingTryParams | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const q = new URLSearchParams(raw);
  const rid = q.get("rid");
  if (!rid) return null;
  return {
    rid,
    rule: q.get("rule") || undefined,
    query: q.get("query") || undefined,
    example: q.get("example") || undefined,
  };
}

export function testingTrySearch(params: TestingTryParams): string {
  const q = new URLSearchParams();
  q.set("rid", params.rid);
  if (params.rule) q.set("rule", params.rule);
  if (params.query) q.set("query", params.query);
  if (params.example) q.set("example", params.example);
  return "?" + q.toString();
}

function safeDomIdPart(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function testingOperationDomId(rid: string, rule: string): string {
  return `try-op-${safeDomIdPart(rid)}-${safeDomIdPart(rule)}`;
}

export function testingQueryFormDomId(
  rid: string,
  queryName: string,
  exampleName?: string
): string {
  const base = [
    "try-q",
    safeDomIdPart(rid),
    safeDomIdPart(queryName),
  ].join("-");
  return exampleName
    ? `${base}-${safeDomIdPart(exampleName)}`
    : base;
}

export function testingEventFormDomId(opts: {
  rid: string;
  rule: string;
  domain: string;
  name: string;
  exampleName?: string;
}): string {
  const base = [
    "try",
    safeDomIdPart(opts.rid),
    safeDomIdPart(opts.rule),
    safeDomIdPart(opts.domain),
    safeDomIdPart(opts.name),
  ].join("-");
  return opts.exampleName
    ? `${base}-${safeDomIdPart(opts.exampleName)}`
    : base;
}
