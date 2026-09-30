/**
 * SKY rotate protocol: body parsing and ingress handling (Phase D).
 */

import test from "ava";
import * as cuid from "cuid";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import {
  parseSkyRotateBody,
  skyRotateToWranglerAttrs,
  SKY_ROTATE,
} from "../src/identity/skyProtocol";
import { handleSkyRotateAtIngress } from "../src/identity/skyRotation";
import { IdentityError } from "../src/identity/errors";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

test("parseSkyRotateBody validates required fields", (t) => {
  const rotate = parseSkyRotateBody({
    sky_version: "1.0",
    prior_webvh_did: "did:webvh:old:scid:abc",
    new_webvh_did: "did:webvh:new:scid:abc",
    new_tx_host: "http://localhost:3000",
    new_didcomm_endpoint: "http://localhost:3000/sky/event/eci/none/dido/didcomm_message",
  });
  t.is(rotate.prior_webvh_did, "did:webvh:old:scid:abc");
  t.is(rotate.new_webvh_did, "did:webvh:new:scid:abc");
  t.is(rotate.new_tx_host, "http://localhost:3000");
});

test("parseSkyRotateBody rejects invalid body", (t) => {
  t.throws(() => parseSkyRotateBody(null), { message: /Invalid SKY rotate body/ });
  t.throws(() => parseSkyRotateBody({ prior_webvh_did: "x" }), {
    message: /missing prior_webvh_did or new_webvh_did/,
  });
});

test("skyRotateToWranglerAttrs maps rotate fields", (t) => {
  const rotate = parseSkyRotateBody({
    prior_webvh_did: "did:webvh:old:scid:abc",
    new_webvh_did: "did:webvh:new:scid:abc",
    new_tx_host: "http://localhost:4000",
    new_didcomm_endpoint: "http://localhost:4000/sky/event/x/none/dido/didcomm_message",
  });
  const attrs = skyRotateToWranglerAttrs(rotate, {
    Id: "sub-1",
    peer_did: "did:peer:4:peer",
  });
  t.is(attrs.prior_webvh_did, rotate.prior_webvh_did);
  t.is(attrs.new_webvh_did, rotate.new_webvh_did);
  t.is(attrs.new_tx_host, rotate.new_tx_host);
  t.is(attrs.Id, "sub-1");
});

test("handleSkyRotateAtIngress updates peer subscription and pendingRotations", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const subId = cuid();
  const senderPeer = "did:peer:4:remote-sender";
  const priorWebvh = "did:webvh:localhost:3000:scid:old:picos/root";
  const newWebvh = "did:webvh:localhost:4000:scid:old:picos/root";
  const newHost = "http://localhost:4000";
  const newEndpoint =
    "http://localhost:4000/sky/event/eci/none/dido/didcomm_message";

  await pe.identity.putPeerSubscription(root.id, {
    subscriptionId: subId,
    peerDid: "did:peer:4:local",
    remotePeerDid: senderPeer,
    remoteWebvhDid: priorWebvh,
    remoteTxHost: "http://localhost:3000",
    remoteDidcommEndpoint:
      "http://localhost:3000/sky/event/old/none/dido/didcomm_message",
    createdAt: new Date().toISOString(),
  });

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  const result = await handleSkyRotateAtIngress(deps, root.id, {
    id: cuid(),
    typ: "application/didcomm-plain+json",
    type: SKY_ROTATE,
    from: senderPeer,
    body: {
      sky_version: "1.0",
      prior_webvh_did: priorWebvh,
      new_webvh_did: newWebvh,
      new_tx_host: newHost,
      new_didcomm_endpoint: newEndpoint,
    },
    created_time: Math.floor(Date.now() / 1000),
  });

  t.is(result.status, "ok");
  t.is(result.subscriptionId, subId);
  t.is(result.new_webvh_did, newWebvh);

  const stored = await pe.identity.getPeerSubscription(root.id, subId);
  t.is(stored!.remoteWebvhDid, newWebvh);
  t.is(stored!.remoteTxHost, newHost);
  t.is(stored!.remoteDidcommEndpoint, newEndpoint);

  const pending = (await pe.identity.getPendingRotations(root.id))!;
  t.is(pending.length, 1);
  t.is(pending[0].priorDid, priorWebvh);
  t.is(pending[0].newDid, newWebvh);
  t.is(pending[0].peerDid, senderPeer);
  t.is(pending[0].subscriptionId, subId);

  await pe.pf.db.close();
});

test("handleSkyRotateAtIngress rejects unknown sender", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  await t.throwsAsync(
    handleSkyRotateAtIngress(deps, root.id, {
      id: cuid(),
      typ: "application/didcomm-plain+json",
      type: SKY_ROTATE,
      from: "did:peer:4:unknown",
      body: {
        prior_webvh_did: "did:webvh:old",
        new_webvh_did: "did:webvh:new",
      },
      created_time: Math.floor(Date.now() / 1000),
    }),
    { instanceOf: IdentityError, message: /unknown_subscription/ }
  );

  await pe.pf.db.close();
});

test("handleSkyRotateAtIngress rejects invalid rotate body", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const senderPeer = "did:peer:4:sender";

  await pe.identity.putPeerSubscription(root.id, {
    subscriptionId: cuid(),
    peerDid: "did:peer:4:local",
    remotePeerDid: senderPeer,
    createdAt: new Date().toISOString(),
  });

  const deps = {
    store: pe.identity,
    pf: pe.pf,
    getBaseUrl: () => pe.base_url,
    identity: pe.identityService,
  };

  await t.throwsAsync(
    handleSkyRotateAtIngress(deps, root.id, {
      id: cuid(),
      typ: "application/didcomm-plain+json",
      type: SKY_ROTATE,
      from: senderPeer,
      body: { bad: true },
      created_time: Math.floor(Date.now() / 1000),
    }),
    { message: /SKY rotate body missing/ }
  );

  await pe.pf.db.close();
});
