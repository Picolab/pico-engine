export interface PicoBox {
  eci: string;
  parent: string | null;
  children: string[];

  name: string;
  backgroundColor: string;

  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PicoDetails {
  parent: string | null;
  children: string[];
  channels: Channel[];
  rulesets: PicoRuleset[];
}
export interface PicoRuleset {
  rid: string;
  version: string;
  config: { [name: string]: any };
}
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

export interface TestingSchema {
  queries?: { name: string; args?: string[] }[];
  events?: { domain: string; name: string; attrs?: string[] }[];
}
