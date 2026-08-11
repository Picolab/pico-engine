import { krl } from "krl-stdlib";
import { IdentityService } from "./IdentityService";
import { IdentityError } from "./errors";

const QUERY_TIMEOUT = 10000;

export default function initDidoModule(identity: IdentityService) {
  const module: krl.Module = {
    myDid: krl.Function([], async function () {
      return identity.getMyDid(this.rsCtx.pico().id);
    }),

    publicIntro: krl.Function([], async function () {
      return identity.getPublicIntro(this.rsCtx.pico().id);
    }),

    setPublicIntro: krl.Action(["enabled"], async function (enabled: boolean) {
      return identity.setPublicIntro(this.rsCtx.pico().id, !!enabled);
    }),

    acceptsPublicIntro: krl.Function([], async function () {
      return identity.acceptsPublicIntro(this.rsCtx.pico().id);
    }),

    addRoute: krl.Function(["type", "domain", "rule"], async function (
      type: string,
      domain: string,
      rule: string
    ) {
      return identity.addRoute(this.rsCtx.pico().id, type, domain, rule);
    }),

    generateMessage: krl.Function(["messageOptions"], async function (
      messageOptions: Parameters<IdentityService["generateMessage"]>[0]
    ) {
      return identity.generateMessage(messageOptions);
    }),

    pack: krl.Function(["message", "from", "to"], async function (
      message: any,
      from: string,
      to: string
    ) {
      return identity.packMessage(this.rsCtx.pico().id, message, from, to);
    }),

    unpack: krl.Function(["message"], async function (message: string) {
      const result = await identity.unpackMessage(
        this.rsCtx.pico().id,
        message
      );
      return [result.message, result.metadata];
    }),

    route: krl.Function(["message"], async function (message: string) {
      const picoId = this.rsCtx.pico().id;
      const { message: unpacked, metadata: meta } =
        await identity.unpackMessage(picoId, message);

      const introType = "https://picolabs.org/sky/1.0/intro";
      if (unpacked.type === introType) {
        const allowed = await identity.acceptsPublicIntro(picoId);
        if (!allowed) {
          this.log.info("Rejected unsolicited intro — publicIntro is false", {
            picoId,
            from: unpacked.from,
          });
          return undefined;
        }
      }

      const routes = await identity.getRoutes(picoId);
      const body = unpacked as Record<string, any>;

      if (body.type === "https://picolabs.io/event/1.0/event") {
        this.rsCtx.raiseEvent(
          body.body.domain,
          body.body.name,
          body.body.attrs
        );
        return undefined;
      }
      if (body.type === "https://picolabs.io/query/1.0/query") {
        try {
          await this.useModule(body.body.rid);
          return await this.krl.assertFunction(
            this.module(body.body.rid)![body.body.name]
          )(this, body.body.args);
        } catch (error) {
          return "Unable to query: " + error;
        }
      }

      const route = routes[body.type];
      if (route) {
        this.rsCtx.raiseEvent(route.domain, route.name, {
          message: unpacked,
          metadata: meta,
        });
      } else {
        this.log.error("Unknown route for message", { message: unpacked });
      }
      return undefined;
    }),

    prepareQuery: deprecated("prepareQuery"),

    sendQuery: krl.Function(["did", "message"], async function (
      did: string,
      message: any
    ) {
      const picoId = this.rsCtx.pico().id;
      const from = message.from as string;
      if (!from) {
        throw new IdentityError("sendQuery message missing from", 400);
      }
      const doc = await identity.resolveDid(picoId, did);
      const endpoint = extractDidcommEndpoint(doc);
      const packed = await identity.packMessage(picoId, message, from, did);
      const response = await Promise.race([
        this.krl.assertAction(this.module("http")!["post"])(this, {
          url: endpoint,
          json: packed,
        }),
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error("timeout")), QUERY_TIMEOUT)
        ),
      ]).catch(() => "Query timed out");

      if (
        response &&
        typeof response === "object" &&
        (response as any).status_code === 200
      ) {
        return JSON.parse((response as any).content).directives[0].options;
      }
      return response;
    }),

    send: krl.Function(["did", "message"], async function (
      did: string,
      message: any
    ) {
      const picoId = this.rsCtx.pico().id;
      const from = message.from as string;
      const doc = await identity.resolveDid(picoId, did);
      const endpoint = extractDidcommEndpoint(doc);
      const packed = await identity.packMessage(picoId, message, from, did);
      await this.krl.assertAction(this.module("http")!["post"])(this, {
        url: endpoint,
        json: packed,
        autosend: {
          eci: this.rsCtx.pico().channels[0]?.id,
          domain: "dido",
          type: "dido_send_response",
          name: "dido_send_response",
        },
      });
    }),

    createInviteUrl: krl.Function(["base64"], function (base64: string) {
      return identity.createInviteUrl(base64);
    }),

    establishSubscription: krl.Function(["bus"], async function (
      bus: Record<string, unknown>
    ) {
      return identity.establishSubscriptionFromBus(
        this.rsCtx.pico().id,
        bus || {}
      );
    }),

    linkRemotePeer: krl.Function(["subscriptionId", "link"], async function (
      subscriptionId: string,
      link: Record<string, unknown>
    ) {
      return identity.linkRemotePeer(this.rsCtx.pico().id, subscriptionId, {
        remotePeerDid: String(link.remotePeerDid || link.Tx_did || ""),
        remoteWebvhDid:
          typeof link.remoteWebvhDid === "string"
            ? link.remoteWebvhDid
            : undefined,
        remoteMeshRootId:
          typeof link.remoteMeshRootId === "string"
            ? link.remoteMeshRootId
            : undefined,
        remoteTxHost:
          typeof link.remoteTxHost === "string" ? link.remoteTxHost : undefined,
        remoteDidcommEndpoint:
          typeof link.remoteDidcommEndpoint === "string"
            ? link.remoteDidcommEndpoint
            : undefined,
      });
    }),

    sendSkyIntro: krl.Function(["input"], async function (
      input: Record<string, unknown>
    ) {
      return identity.sendSkyIntro(this.rsCtx.pico().id, {
        subscriptionId: String(input.subscriptionId || input.Id || ""),
        targetDid: String(
          input.targetDid || input.target_did || input.target_webvh || ""
        ),
        name: String(input.name || "subscription"),
        Tx_role: String(input.Tx_role || ""),
        Rx_role: String(input.Rx_role || ""),
        channel_type:
          typeof input.channel_type === "string" ? input.channel_type : undefined,
        Tx_host:
          typeof input.Tx_host === "string" ? input.Tx_host : undefined,
      });
    }),

    sendSkyIntroResponse: krl.Function(
      ["subscriptionId", "toPeerDid", "response", "options"],
      async function (
        subscriptionId: string,
        toPeerDid: string,
        response: Record<string, unknown>,
        options: Record<string, unknown> = {}
      ) {
        const status =
          response.status === "rejected" ? "rejected" : "accepted";
        return identity.sendSkyIntroResponse(
          this.rsCtx.pico().id,
          subscriptionId,
          toPeerDid,
          {
            status,
            subscription_id:
              typeof response.subscription_id === "string"
                ? response.subscription_id
                : subscriptionId,
            peer_did_long:
              typeof response.peer_did_long === "string"
                ? response.peer_did_long
                : undefined,
            Tx_host:
              typeof response.Tx_host === "string" ? response.Tx_host : undefined,
            reason:
              typeof response.reason === "string" ? response.reason : undefined,
            detail:
              typeof response.detail === "string" ? response.detail : undefined,
          },
          {
            thid:
              typeof options.thid === "string" ? options.thid : undefined,
            remoteDidcommEndpoint:
              typeof options.remoteDidcommEndpoint === "string"
                ? options.remoteDidcommEndpoint
                : undefined,
          }
        );
      }
    ),

    crossPicoEvent: krl.Function(["subscriptionId", "event"], async function (
      subscriptionId: string,
      event: Record<string, unknown>
    ) {
      return identity.crossPicoEvent(
        this.rsCtx.pico().id,
        undefined,
        subscriptionId,
        {
          domain: String(event.domain || ""),
          name: String(event.name || event.type || ""),
          attrs:
            event.attrs && typeof event.attrs === "object"
              ? (event.attrs as Record<string, unknown>)
              : {},
          eid: typeof event.eid === "string" ? event.eid : undefined,
        }
      );
    }),

    crossPicoQuery: krl.Function(["subscriptionId", "query"], async function (
      subscriptionId: string,
      query: Record<string, unknown>
    ) {
      return identity.crossPicoQuery(
        this.rsCtx.pico().id,
        undefined,
        subscriptionId,
        {
          rid: String(query.rid || ""),
          name: String(query.name || ""),
          args:
            query.args && typeof query.args === "object"
              ? (query.args as Record<string, unknown>)
              : {},
        }
      );
    }),

    teardownSubscription: krl.Function(["subscriptionId"], async function (
      subscriptionId: string
    ) {
      return identity.teardownSubscription(
        this.rsCtx.pico().id,
        subscriptionId
      );
    }),

    picoQuery: krl.Function(["did", "query"], async function (
      did: string,
      query: Record<string, unknown>
    ) {
      return identity.picoQuery(this.rsCtx.pico().id, did, {
        rid: String(query.rid || ""),
        name: String(query.name || ""),
        args:
          query.args && typeof query.args === "object"
            ? (query.args as Record<string, unknown>)
            : {},
      });
    }),

    picoEvent: krl.Action(["did", "event"], async function (
      did: string,
      event: Record<string, unknown>
    ) {
      await identity.picoEvent(this.rsCtx.pico().id, did, {
        domain: String(event.domain || ""),
        name: String(event.name || event.type || ""),
        attrs:
          event.attrs && typeof event.attrs === "object"
            ? (event.attrs as Record<string, unknown>)
            : {},
        eid: typeof event.eid === "string" ? event.eid : undefined,
      });
    }),

    // Legacy did-o / did:peer:2 surface — removed in Layer 2 reboot.
    generateDID: deprecated("generateDID"),
    deleteDID: deprecated("deleteDID"),
    updateDID: deprecated("updateDID"),
    rotateDID: deprecated("rotateDID"),
    rotateInviteDID: deprecated("rotateInviteDID"),
    clearPendingRotations: deprecated("clearPendingRotations"),
    mapDid: deprecated("mapDid"),
    clearDidMap: deprecated("clearDidMap"),
    clearDidDocs: deprecated("clearDidDocs"),
    storeDidDoc: deprecated("storeDidDoc"),
    addLabelsToChannel: deprecated("addLabelsToChannel"),
  };

  return module;
}

function deprecated(name: string) {
  return krl.Function([], async function () {
    throw new IdentityError(
      `dido:${name} removed in Layer 2 reboot — use engine identity primitives`,
      410
    );
  });
}

function extractDidcommEndpoint(doc: Record<string, unknown>): string {
  const services = doc.service as Array<Record<string, unknown>> | undefined;
  if (!services || services.length === 0) {
    throw new IdentityError("DID document has no service endpoints", 404);
  }
  const svc = services.find(
    (s) =>
      s.type === "DIDCommMessaging" ||
      s.type === "Messaging" ||
      s.type === "did-communication"
  );
  const endpoint = svc?.serviceEndpoint;
  if (typeof endpoint === "string") {
    return endpoint;
  }
  if (
    endpoint &&
    typeof endpoint === "object" &&
    typeof (endpoint as any).uri === "string"
  ) {
    return (endpoint as any).uri;
  }
  const fallback = services[0].serviceEndpoint;
  if (typeof fallback === "string") {
    return fallback;
  }
  throw new IdentityError("Could not extract DIDComm service endpoint", 404);
}
