import type {
  EventPolicy,
  EventPolicyRule,
  PolicyCeiling,
  QueryPolicy,
  QueryPolicyRule,
} from "pico-framework";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function cleanEventPolicyFromJson(orig: unknown): EventPolicy {
  if (
    !isRecord(orig) ||
    !Array.isArray(orig.allow) ||
    !Array.isArray(orig.deny)
  ) {
    throw new TypeError(
      "eventPolicy expects { allow: EventPolicyRule[], deny: EventPolicyRule[] }",
    );
  }
  const allow: EventPolicyRule[] = [];
  for (const item of orig.allow) {
    if (!isRecord(item) || typeof item.domain !== "string" || typeof item.name !== "string") {
      throw new TypeError("eventPolicy allow entries need domain and name strings");
    }
    allow.push({ domain: item.domain.trim(), name: item.name.trim() });
  }
  const deny: EventPolicyRule[] = [];
  for (const item of orig.deny) {
    if (!isRecord(item) || typeof item.domain !== "string" || typeof item.name !== "string") {
      throw new TypeError("eventPolicy deny entries need domain and name strings");
    }
    deny.push({ domain: item.domain.trim(), name: item.name.trim() });
  }
  return { allow, deny };
}

function cleanQueryPolicyFromJson(orig: unknown): QueryPolicy {
  if (
    !isRecord(orig) ||
    !Array.isArray(orig.allow) ||
    !Array.isArray(orig.deny)
  ) {
    throw new TypeError(
      "queryPolicy expects { allow: QueryPolicyRule[], deny: QueryPolicyRule[] }",
    );
  }
  const allow: QueryPolicyRule[] = [];
  for (const item of orig.allow) {
    if (!isRecord(item) || typeof item.rid !== "string" || typeof item.name !== "string") {
      throw new TypeError("queryPolicy allow entries need rid and name strings");
    }
    allow.push({ rid: item.rid.trim(), name: item.name.trim() });
  }
  const deny: QueryPolicyRule[] = [];
  for (const item of orig.deny) {
    if (!isRecord(item) || typeof item.rid !== "string" || typeof item.name !== "string") {
      throw new TypeError("queryPolicy deny entries need rid and name strings");
    }
    deny.push({ rid: item.rid.trim(), name: item.name.trim() });
  }
  return { allow, deny };
}

function parseEventRule(v: unknown): EventPolicyRule | null {
  if (!isRecord(v)) return null;
  if (typeof v.domain !== "string" || typeof v.name !== "string") return null;
  return { domain: v.domain, name: v.name };
}

function parseQueryRule(v: unknown): QueryPolicyRule | null {
  if (!isRecord(v)) return null;
  if (typeof v.rid !== "string" || typeof v.name !== "string") return null;
  return { rid: v.rid, name: v.name };
}

export function parsePolicyCeilingFromJson(
  val: unknown,
  fieldName: string,
): PolicyCeiling | undefined {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (!isRecord(val) || !val.eventPolicy || !val.queryPolicy) {
    throw new Error(
      `${fieldName} must be { eventPolicy: { allow, deny }, queryPolicy: { allow, deny } }`,
    );
  }
  return {
    eventPolicy: cleanEventPolicyFromJson(val.eventPolicy),
    queryPolicy: cleanQueryPolicyFromJson(val.queryPolicy),
  };
}

export function parseGlobalEventDenyFromJson(val: unknown): EventPolicyRule[] | undefined {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (!Array.isArray(val)) {
    throw new Error("globalEventDeny must be an array of { domain, name } rules");
  }
  const rules: EventPolicyRule[] = [];
  for (const item of val) {
    const rule = parseEventRule(item);
    if (!rule) {
      throw new Error("globalEventDeny: each entry needs domain and name strings");
    }
    rules.push(rule);
  }
  return rules;
}

export function parseGlobalQueryDenyFromJson(val: unknown): QueryPolicyRule[] | undefined {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (!Array.isArray(val)) {
    throw new Error("globalQueryDeny must be an array of { rid, name } rules");
  }
  const rules: QueryPolicyRule[] = [];
  for (const item of val) {
    const rule = parseQueryRule(item);
    if (!rule) {
      throw new Error("globalQueryDeny: each entry needs rid and name strings");
    }
    rules.push(rule);
  }
  return rules;
}
