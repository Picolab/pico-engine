import fetch from "cross-fetch";
import { CurrentPicoEvent, krl, KrlCtx } from "krl-stdlib";

function eventProperty<T = any>(
  fn: (event: CurrentPicoEvent) => T
): (ctx: KrlCtx) => T | null {
  return krl.Property(function () {
    let event = this.getEvent();
    if (event) {
      return fn(event);
    }
    return null;
  });
}

const event: krl.Module = {
  eci: eventProperty((event) => event.eci),
  domain: eventProperty((event) => event.domain),
  name: eventProperty((event) => event.name),
  attrs: eventProperty((event) => event.data.attrs),

  attr: krl.Function(["name"], function (name) {
    let event = this.getEvent();
    if (event) {
      return event.data.attrs[name];
    }
    return null;
  }),

  eid: eventProperty((event) => event.eid),
  time: eventProperty((event) => event.time),

  send: krl.Action(
    ["options", "host"],
    async function event(options, host) {
      let eci = options.eci;
      if (!krl.isString(eci)) {
        throw new TypeError(
          "eci was " +
            krl.toString(eci) +
            " instead of a string"
        );
      }
      let domain = options.domain;
      let name = options.name || options.type;
      let attrs = options.attrs;
      if (host) {
        const url = `${host}/c/${eci}/event/${domain}/${name}`;

        fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: krl.encode(attrs),
        }).catch((err) => {
          this.log.error(err + ""); // TODO better handling
        });

        return;
      }

      // fire-n-forget event not eventWait
      const eid = await this.rsCtx.event({
        eci,
        domain,
        name,
        data: { attrs },
        time: 0,
      }).catch((err) => {
        this.log.error(err + ""); // TODO better handling
      });

      return eid;
    }
  ),
};

export default event;