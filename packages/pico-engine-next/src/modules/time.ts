import * as krl from "../krl";

const time: krl.Module = {
  now: krl.Function([], () => Date.now()),
  add: krl.Function(["time", "spec"], (time, spec) => {
    if (typeof spec.minutes === "number") {
      time += spec.minutes * 60 * 1000;
    }
    return time;
  })
};

export default time;
