export interface Channel {
  id: string;
  tags: string[];
  eventPolicy: EventPolicy;
  queryPolicy: QueryPolicy;
  mcpPolicy?: McpPolicy;
  /** True when this channel keeps the raw HTTP body for event:raw_body(). */
  rawBody?: boolean;
  familyChannelPicoID: string | null;
}

export interface McpPolicy {
  allow: McpPolicyRule[];
  deny: McpPolicyRule[];
}

export interface McpPolicyRule {
  surface: "channel" | "mesh" | "*";
}

export interface EventPolicy {
  allow: EventPolicyRule[];
  deny: EventPolicyRule[];
}

export interface EventPolicyRule {
  domain: string;
  name: string;
}

export interface QueryPolicy {
  allow: QueryPolicyRule[];
  deny: QueryPolicyRule[];
}

export interface QueryPolicyRule {
  rid: string;
  name: string;
}
