import * as cuid from "cuid";
import fetch from "cross-fetch";
import { PicoFramework } from "pico-framework";
import { IdentityStore } from "./store";
import { DidCommRoutes, PeerSubscriptionRecord } from "./types";
import { IdentityError } from "./errors";
import {
  ensureWebvhDid,
  ensureWebvhForLoadedPicos as provisionWebvhForAllLoadedPicos,
  formatDidLogAsJsonl,
  parallelWebDocForPico,
  portableWebvhLogHttpUrl,
  resolveLocalWebvhLog,
  resolveWebvhDid,
  type EnsureWebvhDidOptions,
} from "./webvh";
import {
  packDidCommMessage,
  unpackDidCommMessage,
  createPeerDid,
  warmPeerDidsForPico,
  resolvePeerDidDocument,
} from "./veramoDidComm";
import {
  establishSubscriptionIdentity,
  linkRemotePeer,
  establishInputFromBus,
  type EstablishSubscriptionInput,
  type EstablishSubscriptionResult,
  type LinkRemotePeerInput,
} from "./establishSubscription";
import {
  crossPicoEvent,
  crossPicoQuery,
  extractDidcommEndpoint,
  type CrossPicoEventInput,
  type CrossPicoQueryInput,
} from "./crossPico";
import {
  SKY_INTRO,
  SKY_INTRO_RESPONSE,
  SKY_EVENT,
  SKY_QUERY,
  parseSkyEventBody,
  parseSkyQueryBody,
} from "./skyProtocol";
import {
  sendSkyIntro,
  sendSkyIntroResponse,
  handleSkyIntroAtIngress,
  handleSkyIntroResponseAtIngress,
  type SkyIntroSendInput,
} from "./skyIntro";
import type { SkyIntroResponseBody } from "./skyProtocol";

export interface DidCommMessageOptions {
  type: string;
  body: unknown;
  from?: string;
  to?: string[];
  thid?: string;
  pthid?: string;
  expires_time?: number;
}

export interface DidCommPlainMessage {
  id: string;
  typ: string;
  type: string;
  body: unknown;
  from?: string;
  to?: string[];
  thid?: string;
  pthid?: string;
  created_time: number;
  expires_time?: number;
}

export interface IdentityServiceDeps {
  store: IdentityStore;
  getBaseUrl: () => string;
  pf: PicoFramework;
}

/**
 * Engine identity primitive — store-backed DID state and DIDComm capabilities.
 * Crypto (pack/unpack) is delegated to Veramo when installed (Epic 2+).
 */
export class IdentityService {
  private store: IdentityStore;
  private getBaseUrl: () => string;
  private pf: PicoFramework;

  constructor(deps: IdentityServiceDeps) {
    this.store = deps.store;
    this.getBaseUrl = deps.getBaseUrl;
    this.pf = deps.pf;
  }

  async ensureWebvhDid(
    picoId: string,
    options: EnsureWebvhDidOptions = {}
  ): Promise<string> {
    return ensureWebvhDid(
      this.store,
      this.pf,
      () => this.getBaseUrl(),
      picoId,
      options
    );
  }

  async ensureWebvhForAllLoadedPicos(): Promise<void> {
    await provisionWebvhForAllLoadedPicos(
      this.store,
      this.pf,
      () => this.getBaseUrl()
    );
    for (const pico of this.pf.loadedPicos()) {
      await warmPeerDidsForPico(this.store, pico.id);
    }
  }

  /**
   * Layer 2 subscription establish — create did:peer + internal Rx + persist keys.
   * Idempotent when called again with the same subscriptionId.
   */
  async establishSubscription(
    picoId: string,
    input: EstablishSubscriptionInput
  ): Promise<EstablishSubscriptionResult> {
    return establishSubscriptionIdentity(this.store, this.pf, picoId, input);
  }

  async establishSubscriptionFromBus(
    picoId: string,
    bus: Record<string, unknown>
  ): Promise<EstablishSubscriptionResult> {
    return this.establishSubscription(picoId, establishInputFromBus(bus));
  }

  async linkRemotePeer(
    picoId: string,
    subscriptionId: string,
    input: LinkRemotePeerInput
  ): Promise<PeerSubscriptionRecord> {
    return linkRemotePeer(this.store, picoId, subscriptionId, input);
  }

  async teardownSubscription(
    picoId: string,
    subscriptionId: string
  ): Promise<void> {
    await this.store.deletePeerSubscription(picoId, subscriptionId);
  }

  async findSubscriptionIdForDid(
    picoId: string,
    did: string
  ): Promise<string | null> {
    return this.store.findSubscriptionIdForDid(picoId, did);
  }

  /**
   * Query a remote pico by DID — layer2 subscription route first, then cold did:webvh.
   */
  async picoQuery(
    picoId: string,
    did: string,
    query: CrossPicoQueryInput
  ): Promise<unknown> {
    const subId = await this.findSubscriptionIdForDid(picoId, did);
    if (subId) {
      return this.crossPicoQuery(picoId, undefined, subId, query);
    }
    return this.coldDidQuery(picoId, did, query);
  }

  /**
   * Send an event to a remote pico by DID via an established layer2 subscription.
   */
  async picoEvent(
    picoId: string,
    did: string,
    event: CrossPicoEventInput
  ): Promise<{ eid: string; responses: unknown[] }> {
    const subId = await this.findSubscriptionIdForDid(picoId, did);
    if (!subId) {
      throw new IdentityError(`No layer2 subscription route for DID ${did}`, 404);
    }
    return this.crossPicoEvent(picoId, undefined, subId, event);
  }

  private async coldDidQuery(
    picoId: string,
    did: string,
    query: CrossPicoQueryInput
  ): Promise<unknown> {
    const from = await this.getMyDid(picoId);
    if (!from) {
      throw new IdentityError("Pico has no did:webvh for cold DID query", 404);
    }
    const message = this.generateMessage({
      type: "https://picolabs.io/query/1.0/query",
      from,
      to: [did],
      body: query,
    });
    const doc = await this.resolveDid(picoId, did);
    const endpoint = extractDidcommEndpoint(doc);
    const packed = await this.packMessage(picoId, message, from, did);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/didcomm-encrypted+json" },
      body: packed,
    });
    if (!res.ok) {
      throw new IdentityError(`Cold DID query failed: HTTP ${res.status}`, res.status);
    }
    const data = await res.json();
    if (data.result !== undefined) {
      return data.result;
    }
    return data;
  }

  async getMyDid(picoId: string): Promise<string | null> {
    return this.store.getWebvhDid(picoId);
  }

  async getPublicIntro(picoId: string): Promise<boolean> {
    const value = await this.store.getPublicIntro(picoId);
    if (value === null) {
      return false;
    }
    return value;
  }

  async setPublicIntro(picoId: string, enabled: boolean): Promise<boolean> {
    await this.store.putPublicIntro(picoId, enabled);
    return true;
  }

  /** Whether unsolicited DIDComm intro to this pico's did:webvh is allowed. */
  async acceptsPublicIntro(picoId: string): Promise<boolean> {
    return this.getPublicIntro(picoId);
  }

  async getWebvhLogJsonl(picoId: string): Promise<string | null> {
    const log = await this.store.getWebvhLog(picoId);
    if (!log || log.length === 0) {
      return null;
    }
    return formatDidLogAsJsonl(log);
  }

  async getParallelWebDoc(
    picoId: string
  ): Promise<Record<string, unknown> | null> {
    return parallelWebDocForPico(this.store, picoId);
  }

  async addRoute(
    picoId: string,
    type: string,
    domain: string,
    name: string
  ): Promise<boolean> {
    const routes = (await this.store.getRoutes(picoId)) || {};
    routes[type] = { domain, name };
    await this.store.putRoutes(picoId, routes);
    return true;
  }

  async getRoutes(picoId: string): Promise<DidCommRoutes> {
    return (await this.store.getRoutes(picoId)) || {};
  }

  generateMessage(options: DidCommMessageOptions): DidCommPlainMessage {
    const message: DidCommPlainMessage = {
      id: cuid(),
      typ: "application/didcomm-plain+json",
      type: options.type,
      body: options.body,
      from: options.from,
      to: options.to,
      thid: options.thid,
      pthid: options.pthid,
      created_time: Math.floor(Date.now() / 1000),
    };
    if (options.expires_time) {
      message.expires_time =
        Math.floor(Date.now() / 1000) + options.expires_time;
    }
    return message;
  }

  /**
   * Pack a plaintext DIDComm message (authcrypt). Requires @veramo/did-comm and
   * supporting packages to be installed (`npm install` in packages/pico-engine).
   */
  async packMessage(
    picoId: string,
    message: DidCommPlainMessage,
    from: string,
    to: string
  ): Promise<string> {
    return packDidCommMessage(picoId, message, from, to, this.store, {
      resolveDid: (did) => this.resolveDid("", did),
    });
  }

  async unpackMessage(picoId: string, jwe: string): Promise<{
    message: DidCommPlainMessage;
    metadata: Record<string, unknown>;
  }> {
    return unpackDidCommMessage(picoId, jwe, this.store);
  }

  /** Create a did:peer (num_algo 2). Prefer establishSubscription for subscriptions. */
  async createPeerDid(_picoId: string): Promise<string> {
    return createPeerDid();
  }

  async registerPeerSubscription(
    picoId: string,
    record: PeerSubscriptionRecord
  ): Promise<void> {
    await this.store.putPeerSubscription(picoId, record);
  }

  async crossPicoEvent(
    fromPicoId: string,
    toPicoId: string | undefined,
    subscriptionId: string,
    event: CrossPicoEventInput
  ): Promise<{ eid: string; responses: unknown[] }> {
    return crossPicoEvent(
      {
        store: this.store,
        pf: this.pf,
        getBaseUrl: this.getBaseUrl,
        identity: this,
      },
      fromPicoId,
      toPicoId,
      subscriptionId,
      event
    );
  }

  async crossPicoQuery(
    fromPicoId: string,
    toPicoId: string | undefined,
    subscriptionId: string,
    query: CrossPicoQueryInput
  ): Promise<unknown> {
    return crossPicoQuery(
      {
        store: this.store,
        pf: this.pf,
        getBaseUrl: this.getBaseUrl,
        identity: this,
      },
      fromPicoId,
      toPicoId,
      subscriptionId,
      query
    );
  }

  private skyIntroDeps() {
    return {
      store: this.store,
      pf: this.pf,
      getBaseUrl: this.getBaseUrl,
      identity: this,
    };
  }

  async sendSkyIntro(
    picoId: string,
    input: SkyIntroSendInput
  ): Promise<{ messageId: string; peerDid: string }> {
    return sendSkyIntro(this.skyIntroDeps(), picoId, input);
  }

  async sendSkyIntroResponse(
    picoId: string,
    subscriptionId: string,
    toPeerDid: string,
    response: Omit<SkyIntroResponseBody, "sky_version">,
    options: { thid?: string; remoteDidcommEndpoint?: string } = {}
  ): Promise<string> {
    return sendSkyIntroResponse(
      this.skyIntroDeps(),
      picoId,
      subscriptionId,
      toPeerDid,
      response,
      options
    );
  }

  /**
   * Door verify: unpack JWE at ingress, route by sender peer DID, deliver SKY payload.
   */
  async handleDidcommIngress(
    ingressEci: string,
    jwe: string
  ): Promise<Record<string, unknown>> {
    const picoId = await this.store.findPicoIdByIngressEci(ingressEci);
    if (!picoId) {
      throw new IdentityError("Unknown DIDComm ingress channel", 404);
    }

    const { message } = await this.unpackMessage(picoId, jwe);
    const senderDid = message.from;
    if (!senderDid) {
      throw new IdentityError("DIDComm message missing from", 400);
    }

    if (message.type === SKY_INTRO) {
      return handleSkyIntroAtIngress(this.skyIntroDeps(), picoId, message);
    }

    if (message.type === SKY_INTRO_RESPONSE) {
      return handleSkyIntroResponseAtIngress(
        this.skyIntroDeps(),
        picoId,
        message
      );
    }

    // Channel policy (Epic 7): authenticated sender peer DID → subscription record →
    // internal Rx channel. Door verify proves crypto + subscription relationship;
    // pf.eventWait / pf.query enforce assertEventPolicy / assertQueryPolicy on rxEci.
    const sub = await this.store.findPeerSubscriptionBySenderDid(
      picoId,
      senderDid
    );
    if (!sub || !sub.rxEci) {
      throw new IdentityError("unknown_subscription", 404);
    }

    const callerDid = sub.remoteWebvhDid || senderDid;

    if (message.type === SKY_EVENT) {
      const body = parseSkyEventBody(message.body);
      try {
        const result = await this.pf.eventWait(
          {
            eci: sub.rxEci,
            domain: body.domain,
            name: body.name,
            data: {
              attrs: { ...body.attrs, callerDid },
            },
            time: 0,
          },
          undefined
        );
        return {
          eid: result.eid,
          responses: result.responses,
          directives: result.responses,
        };
      } catch (err) {
        if (isPolicyError(err)) {
          throw new IdentityError("policy_denied", 403);
        }
        throw err;
      }
    }

    if (message.type === SKY_QUERY) {
      const body = parseSkyQueryBody(message.body);
      try {
        const result = await this.pf.query({
          eci: sub.rxEci,
          rid: body.rid,
          name: body.name,
          args: body.args,
        });
        return { status: "ok", result };
      } catch (err) {
        if (isPolicyError(err)) {
          throw new IdentityError("policy_denied", 403);
        }
        throw new IdentityError(
          (err as Error).message || "query_failed",
          502
        );
      }
    }

    const routes = await this.getRoutes(picoId);
    const route = routes[message.type];
    if (route) {
      return { status: "routed", type: message.type };
    }

    throw new IdentityError(`Unknown SKY message type: ${message.type}`, 400);
  }

  /** Resolve a DID from the local store, then via did:webvh remote resolution. */
  async resolveDid(picoId: string, did: string): Promise<Record<string, unknown>> {
    const normalized = did.trim();
    const cached = await this.store.getDidDoc(picoId, normalized);
    if (cached) {
      return cached.doc;
    }
    if (normalized.startsWith("did:webvh:")) {
      const localPicoId = await this.store.findPicoIdByWebvhDid(normalized);
      if (localPicoId) {
        const log = await this.store.getWebvhLog(localPicoId);
        if (log && log.length > 0) {
          const resolved = await resolveLocalWebvhLog(log);
          await this.store.putDidDoc(picoId, {
            did: resolved.did,
            doc: resolved.doc,
            cachedAt: new Date().toISOString(),
          });
          return resolved.doc;
        }
      }
      try {
        const resolved = await resolveWebvhDid(this.store, normalized);
        await this.store.putDidDoc(picoId, {
          did: resolved.did,
          doc: resolved.doc,
          cachedAt: new Date().toISOString(),
        });
        return resolved.doc;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        const logUrl = portableWebvhLogHttpUrl(normalized);
        throw new IdentityError(
          `Remote did:webvh resolution failed${logUrl ? ` (${logUrl})` : ""}: ${detail}`,
          404
        );
      }
    }
    if (normalized.startsWith("did:peer:")) {
      const doc = await resolvePeerDidDocument(normalized);
      await this.store.putDidDoc(picoId, {
        did: normalized,
        doc,
        cachedAt: new Date().toISOString(),
      });
      return doc;
    }
    throw new IdentityError(`DID not found in identity store: ${normalized}`, 404);
  }

  createInviteUrl(base64: string): string {
    const host = this.getBaseUrl();
    if (host.indexOf("localhost") >= 0) {
      return "http://example.com/invite?_oob=" + base64;
    }
    return host + "/invite?_oob=" + base64;
  }
}

function isPolicyError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes("channel policy") ||
      err.message.includes("Denied by channel"))
  );
}
