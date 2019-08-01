import * as _ from "lodash";
import * as krl from "../krl";
import * as cuid from "cuid";
import { PicoEvent } from "pico-framework";
import { KrlCtx } from "../KrlCtx";

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

type ScheduledEvent = ScheduledEvent_at | ScheduledEvent_repeat;

async function addToSchedule(
  ctx: KrlCtx,
  sEvent: ScheduledEvent
): Promise<ScheduledEvent> {
  const schedule = (await ctx.rsCtx.getEnt("_schedule")) || {};
  schedule[sEvent.id] = sEvent;
  await ctx.rsCtx.putEnt("_schedule", schedule);
  ctx.updateScheduler();
  return sEvent;
}

const schedule: krl.Module = {
  at: krl.Postlude(["time", "eci", "domain", "name", "attrs"], function(
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
        time: 0
      }
    });
  }),

  repeat: krl.Postlude(["timespec", "eci", "domain", "name", "attrs"], function(
    timespec,
    eci,
    domain,
    name,
    attrs
  ) {
    return addToSchedule(this, {
      id: cuid(),
      type: "repeat",
      timespec,
      event: {
        eci,
        domain,
        name,
        data: { attrs },
        time: 0
      }
    });
  }),

  list: krl.Function([], async function() {
    const schedule = (await this.rsCtx.getEnt("_schedule")) || {};
    return Object.values(schedule);
  }),

  get: krl.Function(["id"], async function(id) {
    const schedule = (await this.rsCtx.getEnt("_schedule")) || {};
    return schedule[id] || null;
  }),

  remove: krl.Action(["id"], async function(id) {
    await this.rsCtx.putEnt(
      "_schedule",
      _.omit(this.rsCtx.getEnt("_schedule") || {}, id)
    );
    this.updateScheduler();
  }),

  clear: krl.Action([], async function() {
    await this.rsCtx.delEnt("_schedule");
    this.updateScheduler();
  })
};

export default schedule;
