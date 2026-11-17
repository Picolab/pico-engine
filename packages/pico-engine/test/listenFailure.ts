/**
 * A taken listen port is reported as a startup failure.
 * Node emits it as an 'error' event; without a listener the process throws.
 */

import test from "ava";
import * as net from "net";
import { startEngine } from "../src/index";
import { tmpHome } from "./helpers/tmpHome";

test("startEngine rejects when the port is already in use", async (t) => {
  const blocker = net.createServer();
  await new Promise<void>((resolve, reject) => {
    blocker.once("error", reject);
    blocker.listen(0, () => resolve());
  });
  const address = blocker.address();
  if (!address || typeof address === "string") {
    blocker.close();
    t.fail("blocker has no port");
    return;
  }

  const home = tmpHome();
  try {
    const err = await t.throwsAsync(() =>
      startEngine({
        home,
        port: address.port,
        autoCreateRootPico: false,
      })
    );
    t.is((err as NodeJS.ErrnoException).code, "EADDRINUSE");
  } finally {
    await new Promise<void>((resolve) => blocker.close(() => resolve()));
  }
});
