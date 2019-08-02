import test from "ava";
import * as _ from "lodash";
import { Scheduler } from "../src/Scheduler";

test("Scheduler - at", async t => {
  let timeoutHandler: any = null;
  let currentNow = 0;

  const scheduler = new Scheduler(
    (timespec, handler) => ({ handler, cancel() {} }),
    (handler, time) => (timeoutHandler = handler),
    () => (timeoutHandler = null),
    () => currentNow
  );

  let log: string[] = [];

  scheduler.addFuture("foo", 100, () => log.push("foo"));
  scheduler.addFuture("bar", 200, () => log.push("bar"));
  scheduler.addFuture("baz", 100, () => log.push("baz"));

  t.deepEqual(log, []);

  currentNow = 99;
  timeoutHandler();
  scheduler.update();
  t.deepEqual(log, []);

  currentNow = 100;
  timeoutHandler();
  t.deepEqual(log, ["foo", "baz"]);

  currentNow = 200;
  scheduler.addFuture("qux", 123, () => log.push("qux"));
  t.deepEqual(log, ["foo", "baz"]);
  timeoutHandler();
  t.deepEqual(log, ["foo", "baz", "qux", "bar"]);

  currentNow = 999;
  scheduler.update();
  t.is(timeoutHandler, null, "no events, so no timeout");

  log = [];
  scheduler.addFuture("quux", 800, () => log.push("quux"));
  scheduler.addFuture("missed", 800, () => log.push("missed"));
  scheduler.addFuture("future", 123456, () => log.push("future"));
  scheduler.removeFuture("missed");
  t.deepEqual(log, []);
  timeoutHandler();
  t.deepEqual(log, ["quux"]);
  currentNow = 123456789;
  scheduler.update();
  timeoutHandler();
  t.deepEqual(log, ["quux", "future"]);
});

test("Scheduler - cron", async t => {
  let log: string[] = [];
  let currentNow = 0;
  let cronHandlers: any = {};

  const scheduler = new Scheduler(
    (timespec, handler) => {
      cronHandlers[timespec] = handler;
      return {
        handler,
        cancel() {
          log.push("canceled " + timespec);
        }
      };
    },
    () => null,
    () => null,
    () => currentNow
  );

  function addCron(id: string) {
    scheduler.addCron(id, id, () => {
      log.push("run " + id);
    });
  }

  addCron("one");
  addCron("two");
  addCron("three");

  cronHandlers["three"]();
  scheduler.removeCron("two");
  scheduler.removeCron("too");

  t.deepEqual(log, ["run three", "canceled two"]);
});
