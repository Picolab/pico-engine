/**
 * Child pico grid layout and pico-engine-ui ruleset compilation.
 */

import test from "ava";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { toFileUrl } from "../src/utils/toFileUrl";
import * as path from "path";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

function fakeAuthenticator(): WebAuthnAdapter {
  return {
    async generateRegistrationOptions(req) {
      return {
        challenge: "reg-1",
        user: { id: req.userID, name: req.userName, displayName: req.userDisplayName },
      } as any;
    },
    async verifyRegistration({ response }) {
      return {
        verified: true,
        credential: {
          id: (response as any).id,
          publicKey: new Uint8Array([1]),
          counter: 0,
          transports: ["internal"],
        },
      };
    },
    async generateAuthenticationOptions() {
      return { challenge: "auth-1" } as any;
    },
    async verifyAuthentication() {
      return { verified: true, newCounter: 1 };
    },
  };
}

test("new_child_created lays out children in a grid", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  const verified = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-owner" } as any,
  });

  const rootUi = verified.uiECI;
  const positions: Array<{ x: number; y: number }> = [];

  for (const name of ["Alpha", "Beta", "Gamma"]) {
    await pe.pf.eventQuery(
      {
        eci: rootUi,
        domain: "engine_ui",
        name: "new",
        data: { attrs: { name, backgroundColor: "#87CEFA" } },
        time: 0,
      },
      {
        eci: rootUi,
        rid: "io.picolabs.pico-engine-ui",
        name: "box",
        args: {},
      }
    );
    const rootBox = await pe.pf.query({
      eci: rootUi,
      rid: "io.picolabs.pico-engine-ui",
      name: "box",
    });
    const childUi = rootBox.children[rootBox.children.length - 1];
    const childBox = await pe.pf.query({
      eci: childUi,
      rid: "io.picolabs.pico-engine-ui",
      name: "box",
    });
    positions.push({ x: childBox.x, y: childBox.y });
  }

  t.is(positions.length, 3);
  t.not(positions[0].x, positions[1].x);
  t.not(positions[1].x, positions[2].x);
  // first three children share a row in the 4-column grid
  t.is(positions[0].y, positions[2].y);
  t.is(positions[1].x - positions[0].x, 118);
});

test("engine restart preserves saved child positions", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  const verified = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-owner" } as any,
  });

  const rootUi = verified.uiECI;

  await pe.pf.eventQuery(
    {
      eci: rootUi,
      domain: "engine_ui",
      name: "new",
      data: { attrs: { name: "Alpha", backgroundColor: "#87CEFA" } },
      time: 0,
    },
    {
      eci: rootUi,
      rid: "io.picolabs.pico-engine-ui",
      name: "box",
      args: {},
    }
  );

  const rootBox = await pe.pf.query({
    eci: rootUi,
    rid: "io.picolabs.pico-engine-ui",
    name: "box",
  });
  const childUi = rootBox.children[0];

  const custom = { x: 400, y: 250, width: 120, height: 90 };
  await pe.pf.eventQuery(
    {
      eci: childUi,
      domain: "engine_ui",
      name: "box",
      data: { attrs: custom },
      time: 0,
    },
    {
      eci: childUi,
      rid: "io.picolabs.pico-engine-ui",
      name: "box",
      args: {},
    }
  );

  await pe.pf.event({
    eci: rootUi,
    domain: "engine",
    name: "started",
    data: { attrs: {} },
    time: 0,
  });

  const childAfterRestart = await pe.pf.query({
    eci: childUi,
    rid: "io.picolabs.pico-engine-ui",
    name: "box",
  });

  t.is(childAfterRestart.x, custom.x);
  t.is(childAfterRestart.y, custom.y);
  t.is(childAfterRestart.width, custom.width);
  t.is(childAfterRestart.height, custom.height);
});

test("pico-engine-ui ruleset compiles after layout changes", async (t) => {
  const pe = await startIsolatedEngine({ webauthn: fakeAuthenticator() });
  const url = toFileUrl(
    path.resolve(__dirname, "../krl/io.picolabs.pico-engine-ui.krl")
  );
  const flushed = await pe.rsRegistry.flush(url);
  t.is(flushed.rid, "io.picolabs.pico-engine-ui");
});
