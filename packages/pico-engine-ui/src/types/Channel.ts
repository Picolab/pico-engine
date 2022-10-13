export interface Channel {
  id: string;
  tags: string[];
  eventPolicy: EventPolicy;
  queryPolicy: QueryPolicy;
  familyChannelPicoID: string | null;
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
