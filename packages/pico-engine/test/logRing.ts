import test from "ava";
import {
  clearPicoLogRing,
  picoLogEntries,
  rememberPicoLogLine,
  subscribePicoLogRing,
} from "../src/logging";

function line(picoId: string, txnId: string, msg: string): string {
  return JSON.stringify({
    level: 50,
    time: "2026-11-09T20:00:00.000Z",
    picoId,
    txnId,
    msg,
  });
}

test.beforeEach(() => {
  clearPicoLogRing();
});

test.serial("keeps the last N transactions per pico and ignores lines with no transaction", (t) => {
  rememberPicoLogLine(line("pico-a", "t1", "txnStart"), 2);
  rememberPicoLogLine(line("pico-a", "t1", "txnDone"), 2);
  rememberPicoLogLine(line("pico-a", "t2", "txnStart"), 2);
  rememberPicoLogLine(line("pico-b", "other", "txnStart"), 2);
  rememberPicoLogLine(
    JSON.stringify({ level: 50, time: "2026-11-09T20:00:00.000Z", msg: "startup" }),
    2
  );
  rememberPicoLogLine(line("pico-a", "t3", "txnStart"), 2);

  const a = picoLogEntries("pico-a");
  t.deepEqual(
    a.map((entry) => entry.txnId),
    ["t2", "t3"]
  );
  t.is(a[0].level, "debug");
  t.deepEqual(
    picoLogEntries("pico-b").map((entry) => entry.txnId),
    ["other"]
  );
  t.false(a.some((entry) => "picoId" in entry));
});

test.serial("notifies listeners when a transaction finishes", (t) => {
  const seen: string[] = [];
  const stop = subscribePicoLogRing((picoId, txnId) => {
    seen.push(`${picoId}:${txnId}`);
  });
  rememberPicoLogLine(line("pico-a", "t1", "txnStart"), 2);
  rememberPicoLogLine(line("pico-a", "t1", "txnDone"), 2);
  rememberPicoLogLine(line("pico-a", "t2", "txnError"), 2);
  stop();
  rememberPicoLogLine(line("pico-a", "t3", "txnDone"), 2);
  t.deepEqual(seen, ["pico-a:t1", "pico-a:t2"]);
});
