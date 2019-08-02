const lt = require("long-timeout"); // makes it possible to have a timeout longer than 24.8 days (2^31-1 milliseconds)
const schedule = require("node-schedule");

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
    this.scheduleJob = scheduleJob || schedule.scheduleJob;
    this.setTimeout = setTimeout || lt.setTimeout;
    this.clearTimeout = clearTimeout || lt.clearTimeout;
    this.now = now || Date.now;
  }

  addFuture(id: string, time: number, handler: () => void) {
    this.futures.push({ id, time, handler });
    this.futures.sort((a, b) => a.time - b.time);
    this.update();
  }

  removeFuture(id: string) {
    this.futures = this.futures.filter(future => {
      return future.id !== id;
    });
    this.update();
  }

  addCron(id: string, timespec: string, handler: () => void) {
    this.crons[id] = this.scheduleJob(timespec, handler);
  }

  removeCron(id: string) {
    if (this.crons[id]) {
      this.crons[id].cancel();
      delete this.crons[id];
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
    this.futures = this.futures.filter(future => {
      if (future.time <= now) {
        future.handler();
        return false; // remove it now that it's done
      }
      return true;
    });
  }
}
