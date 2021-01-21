import { CurrentPicoEvent, krl, KrlCtx } from "krl-stdlib";
import { PicoEngineCore } from "../PicoEngineCore";

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

export default function initMetaModule(core: PicoEngineCore) {
  const meta: krl.Module = {
    eci: eventProperty((event) => event.eci),

    host: krl.Property(function host() {
      return core.base_url;
    }),

    inEvent: krl.Property(function rid() {
      return this.getEvent() ? true : false;
    }),

    inQuery: krl.Property(function rid() {
      return this.getQuery() ? true : false;
    }),

    picoId: krl.Property(function rid(){
      return this.rsCtx.pico().id;
    }),

    rid: krl.Property(function rid() {
      return this.rsCtx.ruleset.rid;
    }),

    ruleName: krl.Property(function rid() {
      return this.getCurrentRuleName();
    }),

    rid_url: krl.Property(function rid_url() {
      return this.rsCtx.ruleset.config["url"];
    }),

    rulesetURI: krl.Property(function rid_url() {
      return this.rsCtx.ruleset.config["url"];
    }),

    txnId: krl.Property(function txnId() {
      const event = this.getEvent();
      const query = this.getQuery();
      return event ? event.eid : query ? query.qid : null;
    }),

    rid_config: krl.Property(function rid_config() {
      return this.rsCtx.ruleset.config["config"];
    }),

  };

  return meta;
}

