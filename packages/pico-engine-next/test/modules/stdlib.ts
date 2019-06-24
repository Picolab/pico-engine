import test from "ava";
import stdlib from "../../src/modules/stdlib";
import { makeKrlCtx } from "../helpers/makeKrlCtx";

async function mkCallLib() {
  const krlCtx = await makeKrlCtx();
  return function callLib(op: string, ...args: any[]) {
    return stdlib[op](krlCtx, args);
  };
}

test("infix operators", async t => {
  const callLib = await mkCallLib();

  t.is(callLib("+", 1), 1);
  t.is(callLib("+", -1), -1);
  t.is(callLib("+", 1, 2), 3);
  t.is(callLib("+", 2.3, 0.1), 2.4);

  // concat +
  t.is(callLib("+", 1, null), "1null");
  t.is(callLib("+", null, 1), "null1");
  t.is(callLib("+", 1, false), "1false");
  t.is(callLib("+", false, 1), "false1");
  t.is(callLib("+", function() {}, "foo"), "[JSObject]foo");
  t.is(callLib("+", 1, true), "1true");
  t.is(callLib("+", "wat", 100), "wat100");
  t.is(callLib("+", {}, []), "[Map][Array]");
});
