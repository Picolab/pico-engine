/**
 * LevelDB startup recovery after stale LOCK files and graceful shutdown.
 */

import test from "ava";
import * as fs from "fs/promises";
import * as path from "path";
import { startEngine } from "../src/index";
import { openClassicLevelWithRecovery } from "../src/levelDb";
import { tmpHome } from "./helpers/tmpHome";

const charwise = require("charwise");
const safeJsonCodec = require("level-json-coerce-null");

test("openClassicLevelWithRecovery opens a fresh database", async (t) => {
  const home = tmpHome();
  const db = await openClassicLevelWithRecovery(path.join(home, "db"), {
    keyEncoding: charwise,
    valueEncoding: safeJsonCodec,
  });
  await db.put(["test"], "ok");
  t.is(await db.get(["test"]), "ok");
  await db.close();
});

test("openClassicLevelWithRecovery clears a stale LOCK file", async (t) => {
  const home = tmpHome();
  const location = path.join(home, "db");
  await fs.mkdir(location, { recursive: true });
  await fs.writeFile(path.join(location, "LOCK"), "stale");

  const db = await openClassicLevelWithRecovery(location, {
    keyEncoding: charwise,
    valueEncoding: safeJsonCodec,
  });
  await db.put(["recovered"], true);
  t.true(await db.get(["recovered"]));
  await db.close();
});

test("startEngine shutdown closes databases for clean restart", async (t) => {
  const home = tmpHome();
  const engine = await startEngine({
    home,
    port: 0,
    autoCreateRootPico: true,
  });

  const rootId = engine.pf.rootPicos()[0].id;
  await engine.shutdown();

  const db = await openClassicLevelWithRecovery(path.join(home, "db"), {
    keyEncoding: charwise,
    valueEncoding: safeJsonCodec,
  });
  t.is(await db.get(["root-pico"]), rootId);
  await db.close();
});
