/**
 * Helpers for portable move demo tests.
 */

import type { Pico } from "pico-framework";
import type { startIsolatedEngine } from "./isolatedEngine";
import { toTestKrlURL } from "./toTestKrlURL";

export const allowAll = {
  tags: ["allow-all"],
  eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
  queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
};

export type TestEngine = Awaited<ReturnType<typeof startIsolatedEngine>>;

export async function registerMeshRoot(
  pe: TestEngine,
  displayName: string,
  credentialId: string
) {
  const reg = await pe.auth.registerNewAccountOptions({ displayName });
  const verified = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: credentialId } as any,
  });
  return {
    rootPicoId: verified.account.rootPicoId,
    uiECI: verified.uiECI!,
  };
}

export async function createChild(
  pe: TestEngine,
  parent: Pico,
  parentChann: { id: string },
  name: string
) {
  await pe.pf.eventWait({
    eci: parentChann.id,
    domain: "wrangler",
    name: "new_child_request",
    data: { attrs: { name } },
    time: 0,
  });
  const childId = parent.toReadOnly().children.slice(-1)[0];
  return pe.pf.getPico(childId);
}

export async function installMoveDemo(pe: TestEngine, pico: Pico) {
  const url = toTestKrlURL("io.picolabs.move_demo.krl");
  const rs = await pe.rsRegistry.load(url);
  await pico.install(rs.ruleset, { url });
}

export async function establishLayer2SubToTarget(
  peTx: TestEngine,
  txPico: Pico,
  txChann: { id: string },
  peRx: TestEngine,
  rxPico: Pico,
  rxChann: { id: string },
  subName: string
): Promise<string> {
  await peRx.identity.putPublicIntro(rxPico.id, true);
  const targetWebvh = (await peRx.identity.getWebvhDid(rxPico.id))!;

  await peTx.pf.eventWait({
    eci: txChann.id,
    domain: "wrangler",
    name: "subscription",
    data: {
      attrs: {
        layer2: true,
        target_did: targetWebvh,
        name: subName,
        Tx_role: "member",
        Rx_role: "community",
        channel_type: "Tx_Rx",
      },
    },
    time: 0,
  });

  const inbound = (await peRx.pf.query({
    eci: rxChann.id,
    rid: "io.picolabs.subscription",
    name: "inbound",
    args: {},
  })) as Array<{ Id: string; name?: string }>;

  const subId =
    inbound.find((row) => row.name === subName)?.Id ||
    inbound[inbound.length - 1].Id;

  await peRx.pf.eventWait({
    eci: rxChann.id,
    domain: "wrangler",
    name: "pending_subscription_approval",
    data: { attrs: { Id: subId } },
    time: 0,
  });

  return subId;
}
