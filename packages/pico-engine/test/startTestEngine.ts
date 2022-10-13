import test from "ava";
import { startTestEngine } from "./helpers/startTestEngine";

test("startTestEngine", async t => {
  await t.notThrowsAsync(startTestEngine());
});
