import * as krl from "../krl";
import { CurrentPicoEvent, KrlCtx } from "../KrlCtx";

function eventProperty<T = any>(
  fn: (event: CurrentPicoEvent) => T
): (ctx: KrlCtx) => T | null {
  return krl.Property(function() {
    let event = this.getEvent();
    if (event) {
      return fn(event);
    }
    return null;
  });
}

const event: krl.Module = {
  eci: eventProperty(event => event.eci),
  domain: eventProperty(event => event.domain),
  name: eventProperty(event => event.name),
  attrs: eventProperty(event => event.data.attrs),

  attr: krl.Function(["name"], function(name) {
    let event = this.getEvent();
    if (event) {
      return event.data.attrs[name];
    }
    return null;
  }),

  eid: eventProperty(event => event.eid),
  time: eventProperty(event => event.time)
};

export default event;
