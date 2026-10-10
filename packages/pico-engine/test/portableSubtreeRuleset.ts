/**
 * io.picolabs.portable_subtree ruleset — KRL export/import utility.
 */

import test from "ava";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { engineKrlFileUrl } from "../src/bundledKrl";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resetVeramoAgentForTests } from "../src/identity/veramoDidComm";
import {
  allowAll,
  createChild,
  establishLayer2SubToTarget,
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
        user: { id: req.userID, name: req.userName, displayName: req.userDisplayName },
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

async function installPortableSubtree(pe: Awaited<ReturnType<typeof startIsolatedEngine>>, pico: { install: Function }) {
  const url = engineKrlFileUrl("io.picolabs.portable_subtree.krl", pe.base_url);
  const { ruleset } = await pe.rsRegistry.flush(url);
  await pico.install(ruleset, { url, config: {} });
}

test("portable_subtree RS export query and import event", async (t) => {
  const pe1 = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: true,
    autoCreateRootPico: false,
  });
  const pe2 = await startIsolatedEngine({ autoCreateRootPico: true });

  const mesh1A = await registerMeshRoot(pe1, "Mesh 1A", "cred-rs-1a");
  const root1A = pe1.pf.getPico(mesh1A.rootPicoId);
  const root2A = pe2.pf.rootPicos()[0];

  await installPortableSubtree(pe1, root1A);
  await installPortableSubtree(pe2, root2A);

  const ch1A = await root1A.newChannel(allowAll);
  const ch2A = await root2A.newChannel(allowAll);

  const moveHub = await createChild(pe1, root1A, ch1A, "rs-move-hub");
  const chHub = await moveHub.newChannel(allowAll);
  await pe1.identity.putPublicIntro(moveHub.id, true);

  const peer2A = await createChild(pe2, root2A, ch2A, "rs-peer-2a");
  const chPeer2A = await peer2A.newChannel(allowAll);
  const oldHubId = moveHub.id;

  const sub2A = await establishLayer2SubToTarget(
    pe2,
    peer2A,
    chPeer2A,
    pe1,
    moveHub,
    chHub,
    "rs-sub-2a"
  );

  const secret = "portable-subtree-rs-secret";
  const blob = await pe1.pf.query({
    eci: ch1A.id,
    rid: "io.picolabs.portable_subtree",
    name: "exportSubtree",
    args: { subtreeRootPicoId: oldHubId, secret },
  });
  t.true(typeof blob === "string" && blob.length > 20);

  const summary = (await pe1.pf.query({
    eci: ch1A.id,
    rid: "io.picolabs.portable_subtree",
    name: "summarizeExportBlob",
    args: { blob, secret },
  })) as { establishedCount: number; hasIdentity: boolean };
  t.true(summary.establishedCount >= 1);
  t.true(summary.hasIdentity);

  await pe2.pf.eventWait({
    eci: ch2A.id,
    domain: "portable_subtree",
    name: "import",
    data: { attrs: { blob, secret } },
    time: 0,
  });

  const importResult = (await pe2.pf.query({
    eci: ch2A.id,
    rid: "io.picolabs.portable_subtree",
    name: "lastImport",
    args: {},
  })) as { newRootPicoId: string; relocation: { peersNotified: number } };

  t.truthy(importResult.newRootPicoId);
  t.true(importResult.relocation.peersNotified >= 1);

  const after2A = await pe2.identityService.crossPicoQuery(
    peer2A.id,
    undefined,
    sub2A,
    { rid: "io.picolabs.wrangler", name: "id", args: {} }
  );
  t.is(after2A, importResult.newRootPicoId);

  await pe1.pf.db.close();
  await pe2.pf.db.close();
});
