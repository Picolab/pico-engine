/**
 * Full portable move demo: two engines, three meshes, cross-mesh subs survive move.
 *
 * Engine 1 — mesh 1A (move source) + mesh 1B (intra-engine peer)
 * Engine 2 — mesh 2A (import destination + cross-engine peer)
 */

import test from "ava";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import { webvhScidFromStore } from "../src/identity/webvhRelocation";
import {
  allowAll,
  createChild,
  establishLayer2SubToTarget,
  installMoveDemo,
  registerMeshRoot,
} from "./helpers/portableMoveDemo";

test.beforeEach(() => {
  resetVeramoAgentForTests();
});

function fakeAuthenticator(): WebAuthnAdapter {
  let n = 0;
  return {
    async generateRegistrationOptions(req) {
      n += 1;
      return {
        challenge: `reg-${n}`,
        user: {
          id: req.userID,
          name: req.userName,
          displayName: req.userDisplayName,
        },
      } as any;
    },
    async verifyRegistration({ response }) {
      return {
        verified: true,
        credential: {
          id: (response as any).id,
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
        },
      };
    },
    async generateAuthenticationOptions() {
      return { challenge: "auth" } as any;
    },
    async verifyAuthentication() {
      return { verified: true, newCounter: 1 };
    },
  };
}

test("portable move: hub + dependent relocate from mesh 1A to 2A; subs on 1B and 2A survive", async (t) => {
  const pe1 = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: true,
    autoCreateRootPico: false,
  });
  const pe2 = await startIsolatedEngine({
    autoCreateRootPico: true,
  });

  const mesh1A = await registerMeshRoot(pe1, "Mesh 1A", "cred-1a");
  const mesh1B = await registerMeshRoot(pe1, "Mesh 1B", "cred-1b");
  const root1A = pe1.pf.getPico(mesh1A.rootPicoId);
  const root1B = pe1.pf.getPico(mesh1B.rootPicoId);
  const root2A = pe2.pf.rootPicos()[0];

  t.not(mesh1A.rootPicoId, mesh1B.rootPicoId);
  t.not(mesh1A.rootPicoId, root2A.id);

  const ch1A = await root1A.newChannel(allowAll);
  const ch1B = await root1B.newChannel(allowAll);
  const ch2A = await root2A.newChannel(allowAll);

  const moveHub = await createChild(pe1, root1A, ch1A, "move-hub");
  const chHub = await moveHub.newChannel(allowAll);
  await pe1.identity.putPublicIntro(moveHub.id, true);
  await installMoveDemo(pe1, moveHub);

  const childDep = await createChild(pe1, moveHub, chHub, "dependent");
  const chDep = await childDep.newChannel(allowAll);
  await installMoveDemo(pe1, childDep);
  await pe1.pf.eventWait({
    eci: chDep.id,
    domain: "move_demo",
    name: "setLabel",
    data: { attrs: { label: "dependent-ok" } },
    time: 0,
  });

  const peer1B = await createChild(pe1, root1B, ch1B, "peer-1b");
  const chPeer1B = await peer1B.newChannel(allowAll);

  const peer2A = await createChild(pe2, root2A, ch2A, "peer-2a");
  const chPeer2A = await peer2A.newChannel(allowAll);

  const hubScidBefore = (await webvhScidFromStore(pe1.identity, moveHub.id))!;
  const oldHubId = moveHub.id;
  const oldChildId = childDep.id;

  const sub1B = await establishLayer2SubToTarget(
    pe1,
    peer1B,
    chPeer1B,
    pe1,
    moveHub,
    chHub,
    "sub-1b-to-hub"
  );
  const sub2A = await establishLayer2SubToTarget(
    pe2,
    peer2A,
    chPeer2A,
    pe1,
    moveHub,
    chHub,
    "sub-2a-to-hub"
  );

  const before1B = await pe1.identityService.crossPicoQuery(
    peer1B.id,
    undefined,
    sub1B,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(before1B, oldHubId);

  const before2A = await pe2.identityService.crossPicoQuery(
    peer2A.id,
    undefined,
    sub2A,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(before2A, oldHubId);

  const secret = "portable-move-demo-secret";
  const blob = await pe1.identityService.exportPortableSubtree(
    root1A.id,
    oldHubId,
    secret
  );

  const importResult = await pe2.identityService.importPortableSubtree(
    root2A.id,
    blob,
    secret,
    { renewIngress: true },
    { parentChannelEci: ch2A.id }
  );

  t.is(importResult.picoIdMap[oldHubId], importResult.newRootPicoId);
  t.not(importResult.newRootPicoId, oldHubId);
  t.is(importResult.relocation.scid, hubScidBefore);
  t.true(importResult.relocation.peersNotified >= 2);

  const after1B = await pe1.identityService.crossPicoQuery(
    peer1B.id,
    undefined,
    sub1B,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(after1B, importResult.newRootPicoId);

  const after2A = await pe2.identityService.crossPicoQuery(
    peer2A.id,
    undefined,
    sub2A,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(after2A, importResult.newRootPicoId);

  const event1B = await pe1.identityService.crossPicoEvent(
    peer1B.id,
    undefined,
    sub1B,
    { domain: "wrangler", name: "ping", attrs: { from: "1B" } }
  );
  t.truthy(event1B.eid);

  const newChildId = importResult.picoIdMap[oldChildId];
  const newChild = pe2.pf.getPico(newChildId);
  const newChildChann = await newChild.newChannel(allowAll);
  const label = await pe2.pf.query({
    eci: newChildChann.id,
    rid: "io.picolabs.move_demo",
    name: "getLabel",
    args: {},
  });
  t.is(label, "dependent-ok");

  const stored1B = await pe1.identity.getPeerSubscription(peer1B.id, sub1B);
  t.is(stored1B?.remoteWebvhDid, importResult.relocation.newDid);

  await pe1.pf.db.close();
  await pe2.pf.db.close();
});
