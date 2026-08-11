/**
 * Engine startup exposes the identity store on the mesh LevelDB.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

test("startEngine exposes pe.identity on the mesh db", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const picoId = pe.pf.rootPicos()[0].id;

  await pe.identity.putWebvhDid(picoId, "did:webvh:example:wired");
  t.is(await pe.identity.getWebvhDid(picoId), "did:webvh:example:wired");

  await pe.pf.db.close();
});
