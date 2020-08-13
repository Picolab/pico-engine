import * as cuid from "cuid";
import { krl, KrlCtx } from "krl-stdlib";
import * as _ from "lodash";
import { PicoEvent, PicoFramework } from "pico-framework";

const longTimeout = require("long-timeout"); // makes it possible to have a timeout longer than 24.8 days (2^31-1 milliseconds)
const nodeSchedule = require("node-schedule");

interface ScheduledEvent_base {
  id: string;
  event: PicoEvent;
}

interface ScheduledEvent_at extends ScheduledEvent_base {
  type: "at";
  time: number;
}

interface ScheduledEvent_repeat extends ScheduledEvent_base {
  type: "repeat";
  timespec: string;
}

export type ScheduledEvent = ScheduledEvent_at | ScheduledEvent_repeat;

type ScheduleJob = (
  timespec: string,
  handler: () => void
) => { handler: () => void; cancel: () => void };

type SetTimeout = (handler: () => void, time: number) => void;
type ClearTimeout = (handle: any) => void;

export class Scheduler {
  private currTimeout: any;

  private futures: {
    id: string;
    time: number;
    handler: () => void;
  }[] = [];

  private crons: {
    [id: string]: {
      handler: () => void;
      cancel: () => void;
    };
  } = {};

  private scheduleJob: ScheduleJob;
  private setTimeout: SetTimeout;
  private clearTimeout: ClearTimeout;
  private now: () => number;

  constructor(
    scheduleJob?: ScheduleJob,
    setTimeout?: SetTimeout,
    clearTimeout?: ClearTimeout,
    now?: () => number
  ) {
    this.scheduleJob = scheduleJob || nodeSchedule.scheduleJob;
    this.setTimeout = setTimeout || longTimeout.setTimeout;
    this.clearTimeout = clearTimeout || longTimeout.clearTimeout;
    this.now = now || Date.now;
  }

  addFuture(id: string, time: number, handler: () => void) {
    this.futures.push({ id, time, handler });
    this.futures.sort((a, b) => a.time - b.time);
    this.update();
  }

  addCron(id: string, timespec: string, handler: () => void) {
    this.crons[id] = this.scheduleJob(timespec, handler);
  }

  remove(id: string) {
    if (this.crons[id]) {
      this.crons[id].cancel();
      delete this.crons[id];
    } else {
      let found = false;
      this.futures = this.futures.filter((future) => {
        if (future.id === id) {
          found = true;
          return false;
        }
        return true;
      });
      if (found) {
        this.update();
      }
    }
  }

  update() {
    this.clearTimeout(this.currTimeout);

    const next = this.futures[0];
    if (!next) {
      return;
    }

    // Execute the event by milliseconds from now.
    // If it's in the past it will happen on the next tick
    this.currTimeout = this.setTimeout(
      () => this.onTime(),
      next.time - this.now()
    );
  }

  private onTime() {
    const now = this.now();
    this.futures = this.futures.filter((future) => {
      if (future.time <= now) {
        future.handler();
        return false; // remove it now that it's done
      }
      return true;
    });
  }
}

export function initScheduleModule(pf: PicoFramework) {
  const scheduler = new Scheduler();

  function addScheduledEvent(rid: string, sEvent: ScheduledEvent) {
    if (sEvent.type === "at") {
      scheduler.addFuture(sEvent.id, sEvent.time, async () => {
        const pico = pf.getPico(sEvent.event.eci);
        if (pico) {
          // TODO wrap in pico transaction
          const schedule = (await pico.getEnt(rid, "_schedule")) || {};
          const job = schedule[sEvent.id];
          if (job) {
            await pico.putEnt(rid, "_schedule", _.omit(schedule, sEvent.id));
            pico.event(sEvent.event);
          }
        }
      });
    } else if (sEvent.type === "repeat") {
      scheduler.addCron(sEvent.id, sEvent.timespec, async () => {
        let found = false;
        const pico = pf.getPico(sEvent.event.eci);
        if (pico) {
          // TODO wrap in pico transaction
          const schedule = (await pico.getEnt(rid, "_schedule")) || {};
          const job = schedule[sEvent.id];
          if (job) {
            found = true;
            pico.event(sEvent.event);
          }
        }
        if (!found) {
          scheduler.remove(sEvent.id);
        }
      });
    }
  }

  async function addToSchedule(
    ctx: KrlCtx,
    sEvent: ScheduledEvent
  ): Promise<ScheduledEvent> {
    const schedule = (await ctx.rsCtx.getEnt("_schedule")) || {};
    schedule[sEvent.id] = sEvent;
    await ctx.rsCtx.putEnt("_schedule", schedule);
    addScheduledEvent(ctx.rsCtx.ruleset.rid, sEvent);
    return sEvent;
  }

  const module: krl.Module = {
    at: krl.Postlude(["time", "eci", "domain", "name", "attrs"], function (
      time,
      eci,
      domain,
      name,
      attrs
    ) {
      return addToSchedule(this, {
        id: cuid(),
        type: "at",
        time,
        event: {
          eci,
          domain,
          name,
          data: { attrs },
          time: 0,
        },
      });
    }),

    repeat: krl.Postlude(
      ["timespec", "eci", "domain", "name", "attrs"],
      function (timespec, eci, domain, name, attrs) {
        return addToSchedule(this, {
          id: cuid(),
          type: "repeat",
          timespec,
          event: {
            eci,
            domain,
            name,
            data: { attrs },
            time: 0,
          },
        });
      }
    ),

    list: krl.Function([], async function () {
      const schedule = (await this.rsCtx.getEnt("_schedule")) || {};
      return Object.values(schedule);
    }),

    get: krl.Function(["id"], async function (id) {
      const schedule = (await this.rsCtx.getEnt("_schedule")) || {};
      return schedule[id] || null;
    }),

    remove: krl.Action(["id"], async function (id) {
      await this.rsCtx.putEnt(
        "_schedule",
        _.omit(this.rsCtx.getEnt("_schedule") || {}, id)
      );
      scheduler.remove(id);
    }),

    clear: krl.Action([], async function () {
      const schedule = (await this.rsCtx.getEnt("_schedule")) || {};
      const ids = Object.keys(schedule);
      await this.rsCtx.delEnt("_schedule");
      for (const id of ids) {
        scheduler.remove(id);
      }
    }),
  };

  return {
    module,
    start() {
      return new Promise((resolve, reject) => {
        const s = pf.db.createReadStream({
          gte: ["entvar"],
          lte: ["entvar", undefined], // charwise sorts with null at the bottom and undefined at the top
        });
        s.on("error", reject);
        s.on("end", () => resolve());
        s.on("data", (data) => {
          if (data.key[3] === "_schedule") {
            const rid = data.key[2];
            const value: { [id: string]: ScheduledEvent } = data.value;
            for (const sEvent of Object.values(value)) {
              addScheduledEvent(rid, sEvent);
            }
          }
        });
      });
    },
  };
}
