import { krl } from "krl-stdlib";
import { PicoEngineCore } from "../PicoEngineCore";
import { rulesetSchemaFromRuleset, type RulesetSchema } from "../picoSchema";

export default function initMetaModule(core: PicoEngineCore) {
  const meta: krl.Module = {
    eci: krl.Property(function eci() {
      const event = this.getEvent();
      const query = this.getQuery();
      return event ? event.eci : query ? query.eci : null;
    }),

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

    rulesetConfig: krl.Property(function rid_config() {
      return this.rsCtx.ruleset.config["config"];
    }),

    schema: krl.Property(function schema() {
      const url = this.rsCtx.ruleset.config["url"];
      const cached =
        typeof url === "string" ? core.rsRegistry.getCached(url) : null;
      const fromCache = cached
        ? rulesetSchemaFromRuleset(
            cached.ruleset as { rulesetSchema?: RulesetSchema }
          )
        : null;
      if (fromCache) return fromCache;
      return (
        rulesetSchemaFromRuleset(
          this.rsCtx.ruleset as { rulesetSchema?: RulesetSchema }
        ) ?? null
      );
    }),

  };

  return meta;
}

