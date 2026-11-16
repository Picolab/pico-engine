import * as _ from "lodash";
import { Pico } from "./Pico";
import { PicoEvent } from "./PicoEvent";
import { PicoQuery } from "./PicoQuery";
import { isNotStringOrBlank, LevelBatch } from "./utils";

export const CUSTOM_CHANNEL_ID_MIN_LENGTH = 12;
export const CUSTOM_CHANNEL_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export type McpSurface = "channel" | "mesh";

export interface McpPolicyRule {
  /** `channel` is `/mcp/{eci}`, `mesh` is the whole-mesh endpoint, `*` is both. */
  surface: McpSurface | "*";
}

export interface McpPolicy {
  allow: McpPolicyRule[];
  deny: McpPolicyRule[];
}

export const EMPTY_MCP_POLICY: McpPolicy = { allow: [], deny: [] };

export interface ChannelConfig {
  /** Optional id for manual channel creation; defaults to genID() when omitted. */
  id?: string;
  tags?: string[];
  eventPolicy?: EventPolicy;
  queryPolicy?: QueryPolicy;
  /** Absent on create means default deny: the channel is not exposed to MCP. */
  mcpPolicy?: McpPolicy;
}

export function validateCustomChannelId(id: unknown): string {
  if (typeof id !== "string") {
    throw new TypeError("Channel id must be a string.");
  }
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    throw new Error("Channel id cannot be empty.");
  }
  if (trimmed.length < CUSTOM_CHANNEL_ID_MIN_LENGTH) {
    throw new Error(
      `Channel id must be at least ${CUSTOM_CHANNEL_ID_MIN_LENGTH} characters.`,
    );
  }
  if (!CUSTOM_CHANNEL_ID_PATTERN.test(trimmed)) {
    throw new Error(
      "Channel id may only contain letters, digits, hyphen, and underscore.",
    );
  }
  return trimmed;
}

export interface ChannelReadOnly {
  id: string;
  tags: string[];
  eventPolicy: EventPolicy;
  queryPolicy: QueryPolicy;
  mcpPolicy: McpPolicy;
  familyChannelPicoID: string | null;
}

export class Channel {
  id: string;
  pico: Pico;

  /**
   * A way to categorize channels i.e. bulk update of a group of channels
   */
  tags: string[] = [];

  /**
   * pico-engine had shared policies, however there were more problems by sharing that space
   * pico-framework policies are denormalized i.e. each channel owns their own copy
   */
  eventPolicy: EventPolicy = {
    allow: [{ domain: "*", name: "*" }],
    deny: []
  };
  queryPolicy: QueryPolicy = {
    allow: [{ rid: "*", name: "*" }],
    deny: []
  };
  /** Missing or empty denies both MCP surfaces. */
  mcpPolicy: McpPolicy = { allow: [], deny: [] };

  /**
   * This is set by the family member (parent-child relation) who owns this channel.
   * Only this pico is allowed to send messages through it.
   */
  familyChannelPicoID?: string;

  constructor(
    pico: Pico,
    id: string,
    conf?: ChannelConfig,
    familyChannelPicoID?: string
  ) {
    this.pico = pico;
    this.id = id;
    if (conf && conf.mcpPolicy !== undefined) {
      this.mcpPolicy = cleanMcpPolicy(conf.mcpPolicy);
    }
    if (familyChannelPicoID) {
      this.tags = (conf && conf.tags) || [];
      this.familyChannelPicoID = familyChannelPicoID;
    } else {
      if (conf && conf.tags) {
        this.tags = cleanChannelTags(conf.tags);
      }
      // if not a family channel, use policies
      if (conf && conf.eventPolicy) {
        this.eventPolicy = cleanEventPolicy(conf.eventPolicy);
      }
      if (conf && conf.queryPolicy) {
        this.queryPolicy = cleanQueryPolicy(conf.queryPolicy);
      }
    }
  }

  update(conf: ChannelConfig) {
    if (this.familyChannelPicoID) {
      // can't change anything
      return;
    }
    if (conf.tags) {
      this.tags = cleanChannelTags(conf.tags);
    }
    if (conf.eventPolicy) {
      this.eventPolicy = cleanEventPolicy(conf.eventPolicy);
    }
    if (conf.queryPolicy) {
      this.queryPolicy = cleanQueryPolicy(conf.queryPolicy);
    }
    if (conf.mcpPolicy !== undefined) {
      this.mcpPolicy = cleanMcpPolicy(conf.mcpPolicy);
    }
    // NOTE: can't change familyChannelPicoID
  }

  assertEventPolicy(event: PicoEvent, fromPicoID?: string) {
    this.assertIfFamilyChannel(fromPicoID);
    assertEventPolicy(this.eventPolicy, event);
  }

  assertQueryPolicy(query: PicoQuery, fromPicoID?: string) {
    this.assertIfFamilyChannel(fromPicoID);
    assertQueryPolicy(this.queryPolicy, query);
  }

  private assertIfFamilyChannel(fromPicoID?: string) {
    if (this.familyChannelPicoID) {
      if (this.familyChannelPicoID === fromPicoID) {
        return; // good to go
      } else {
        throw new Error(
          "This is a family channel and only the owner can use it."
        );
      }
    }
  }

  toReadOnly(): ChannelReadOnly {
    return Object.freeze({
      id: this.id,
      tags: this.tags.slice(0),
      eventPolicy: _.cloneDeep(this.eventPolicy),
      queryPolicy: _.cloneDeep(this.queryPolicy),
      mcpPolicy: _.cloneDeep(this.mcpPolicy),
      familyChannelPicoID: this.familyChannelPicoID || null
    });
  }

  toDbPut(): LevelBatch {
    return {
      type: "put",
      key: ["pico-channel", this.id],
      value: {
        id: this.id,
        picoId: this.pico.id,
        tags: this.tags,
        eventPolicy: this.eventPolicy,
        queryPolicy: this.queryPolicy,
        mcpPolicy: this.mcpPolicy,
        familyChannelPicoID: this.familyChannelPicoID || null
      }
    };
  }

  toDbDel(): LevelBatch {
    return { type: "del", key: ["pico-channel", this.id] };
  }

  static fromDb(pico: Pico, val: any): Channel {
    const chann = new Channel(
      pico,
      val.id,
      {
        tags: val.tags,
        eventPolicy: val.eventPolicy,
        queryPolicy: val.queryPolicy,
        ...(val.mcpPolicy !== undefined ? { mcpPolicy: val.mcpPolicy } : {})
      },
      val.familyChannelPicoID
    );
    return chann;
  }
}

export function allowsEventPolicy(
  eventPolicy: EventPolicy,
  event: Pick<PicoEvent, "domain" | "name">
): boolean {
  for (const p of eventPolicy.deny) {
    if (p.domain === "*" || p.domain === event.domain) {
      if (p.name === "*" || p.name === event.name) {
        return false;
      }
    }
  }
  for (const p of eventPolicy.allow) {
    if (p.domain === "*" || p.domain === event.domain) {
      if (p.name === "*" || p.name === event.name) {
        return true;
      }
    }
  }
  return false;
}

export function allowsQueryPolicy(
  queryPolicy: QueryPolicy,
  query: Pick<PicoQuery, "rid" | "name">
): boolean {
  for (const p of queryPolicy.deny) {
    if (p.rid === "*" || p.rid === query.rid) {
      if (p.name === "*" || p.name === query.name) {
        return false;
      }
    }
  }
  for (const p of queryPolicy.allow) {
    if (p.rid === "*" || p.rid === query.rid) {
      if (p.name === "*" || p.name === query.name) {
        return true;
      }
    }
  }
  return false;
}

export function allowsMcpPolicy(
  policy: McpPolicy | undefined,
  surface: McpSurface
): boolean {
  const rules = policy || EMPTY_MCP_POLICY;
  for (const rule of rules.deny) {
    if (rule.surface === "*" || rule.surface === surface) {
      return false;
    }
  }
  for (const rule of rules.allow) {
    if (rule.surface === "*" || rule.surface === surface) {
      return true;
    }
  }
  return false;
}

export function cleanMcpPolicy(orig: any): McpPolicy {
  if (
    !orig ||
    Object.keys(orig)
      .sort()
      .join(",") !== "allow,deny" ||
    !Array.isArray(orig.allow) ||
    !Array.isArray(orig.deny)
  ) {
    throw new TypeError(
      `McpPolicy expects {allow: McpPolicyRule[], deny: McpPolicyRule[]}`
    );
  }
  return {
    allow: orig.allow.map(cleanMcpPolicyRule),
    deny: orig.deny.map(cleanMcpPolicyRule)
  };
}

function cleanMcpPolicyRule(orig: any): McpPolicyRule {
  if (
    !orig ||
    Object.keys(orig).sort().join(",") !== "surface" ||
    (orig.surface !== "channel" && orig.surface !== "mesh" && orig.surface !== "*")
  ) {
    throw new TypeError(
      `McpPolicyRule expects {surface: "channel" | "mesh" | "*"}`
    );
  }
  return { surface: orig.surface };
}

export function assertEventPolicy(eventPolicy: EventPolicy, event: PicoEvent) {
  if (!allowsEventPolicy(eventPolicy, event)) {
    for (const p of eventPolicy.deny) {
      if (p.domain === "*" || p.domain === event.domain) {
        if (p.name === "*" || p.name === event.name) {
          throw new Error("Denied by channel policy");
        }
      }
    }
    throw new Error("Not allowed by channel policy");
  }
}

export function assertQueryPolicy(queryPolicy: QueryPolicy, query: PicoQuery) {
  if (!allowsQueryPolicy(queryPolicy, query)) {
    for (const p of queryPolicy.deny) {
      if (p.rid === "*" || p.rid === query.rid) {
        if (p.name === "*" || p.name === query.name) {
          throw new Error("Denied by channel policy");
        }
      }
    }
    throw new Error("Not allowed by channel policy");
  }
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

export function cleanEventPolicy(orig: any): EventPolicy {
  if (
    !orig ||
    Object.keys(orig)
      .sort()
      .join(",") !== "allow,deny" ||
    !Array.isArray(orig.allow) ||
    !Array.isArray(orig.deny)
  ) {
    throw new TypeError(
      `EventPolicy expects {allow: EventPolicyRule[], deny: EventPolicyRule[]}`
    );
  }

  return {
    allow: orig.allow.map(cleanEventPolicyRule),
    deny: orig.deny.map(cleanEventPolicyRule)
  };
}

function cleanEventPolicyRule(orig: any): EventPolicyRule {
  if (
    !orig ||
    Object.keys(orig)
      .sort()
      .join(",") !== "domain,name" ||
    isNotStringOrBlank(orig.domain) ||
    isNotStringOrBlank(orig.name)
  ) {
    throw new TypeError(
      `EventPolicyRule expects {domain: string, name: string}`
    );
  }
  return {
    domain: orig.domain.trim(),
    name: orig.name.trim()
  };
}

export function cleanQueryPolicy(orig: any): QueryPolicy {
  if (
    !orig ||
    Object.keys(orig)
      .sort()
      .join(",") !== "allow,deny" ||
    !Array.isArray(orig.allow) ||
    !Array.isArray(orig.deny)
  ) {
    throw new TypeError(
      `QueryPolicy expects {allow: QueryPolicyRule[], deny: QueryPolicyRule[]}`
    );
  }

  return {
    allow: orig.allow.map(cleanQueryPolicyRule),
    deny: orig.deny.map(cleanQueryPolicyRule)
  };
}

function cleanQueryPolicyRule(orig: any): QueryPolicyRule {
  if (
    !orig ||
    Object.keys(orig)
      .sort()
      .join(",") !== "name,rid" ||
    isNotStringOrBlank(orig.name) ||
    isNotStringOrBlank(orig.rid)
  ) {
    throw new TypeError(`QueryPolicyRule expects {rid: string, name: string}`);
  }
  return {
    rid: orig.rid.trim(),
    name: orig.name.trim()
  };
}

export function cleanChannelTags(tags: any): string[] {
  if (!Array.isArray(tags)) {
    throw new TypeError(
      "Channel `tags` must be an array of non-empty strings."
    );
  }
  return tags.map(tag => {
    if (typeof tag !== "string") {
      throw new TypeError(
        "Channel `tags` must be an array of non-empty strings."
      );
    }
    tag = tag
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    if (tag.length === 0) {
      throw new TypeError("Channel tag cannot be a blank string.");
    }
    if (tag === "system") {
      throw new TypeError('Cannot tag channel as "system".');
    }
    return tag;
  });
}
