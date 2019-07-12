import * as krl from "../krl";

const ctx: krl.Module = {
  rid: krl.Property(function rid() {
    return this.rsCtx.ruleset.rid;
  }),

  rid_version: krl.Property(function rid_version() {
    return this.rsCtx.ruleset.version;
  }),

  rid_config: krl.Property(function rid_config() {
    return this.rsCtx.ruleset.config;
  }),

  parent: krl.Property(function parent() {
    return this.rsCtx.pico().parent;
  }),

  children: krl.Property(function children() {
    return this.rsCtx.pico().children;
  }),

  channels: krl.Property(function channels() {
    return this.rsCtx.pico().channels;
  }),

  rulesets: krl.Property(function rulesets() {
    return this.rsCtx.pico().rulesets;
  }),

  raiseEvent: krl.Postlude(["domain", "name", "attrs"], function raiseEvent(
    domain: string,
    name: string,
    attrs: any
  ) {
    return this.rsCtx.raiseEvent(domain, name, attrs);
  })
};

export default ctx;
