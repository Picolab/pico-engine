import krl, { KrlModule } from "../krl";

const ctx: KrlModule = {
  rid: krl.property(function rid() {
    return this.rsCtx.ruleset.rid;
  }),

  rid_version: krl.property(function rid_version() {
    return this.rsCtx.ruleset.version;
  }),

  rid_config: krl.property(function rid_config() {
    return this.rsCtx.ruleset.config;
  }),

  parent: krl.property(function parent() {
    return this.rsCtx.pico().parent;
  }),

  children: krl.property(function children() {
    return this.rsCtx.pico().children;
  }),

  channels: krl.property(function channels() {
    return this.rsCtx.pico().channels;
  }),

  rulesets: krl.property(function rulesets() {
    return this.rsCtx.pico().rulesets;
  }),

  raiseEvent: krl.postlude(["domain", "name", "attrs"], function raiseEvent(
    domain: string,
    name: string,
    attrs: any
  ) {
    return this.rsCtx.raiseEvent(domain, name, attrs);
  })
};

export default ctx;
