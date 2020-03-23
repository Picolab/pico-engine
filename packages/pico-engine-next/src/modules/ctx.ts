import * as request from "request";
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
    // TODO include rulesets fetched, but not installed
    return this.rsCtx.pico().rulesets;
  }),

  install: krl.Action(["rid", "version", "config"], function(
    rid: string,
    version: string,
    config: any
  ) {
    // TODO
  }),

  fetchRuleset: krl.Action(["url"], async function fetchRuleset(url: string) {
    // TODO
  }),

  releaseRuleset: krl.Action(["url"], async function releaseRuleset(
    url: string
  ) {
    // TODO
  }),

  raiseEvent: krl.Postlude(
    ["domain", "name", "attrs", "forRid"],
    function raiseEvent(
      domain: string,
      name: string,
      attrs: any,
      forRid?: string
    ) {
      return this.rsCtx.raiseEvent(domain, name, attrs, forRid);
    }
  ),

  event: krl.Action(
    ["eci", "domain", "name", "attrs", "host"],
    async function event(eci, domain, name, attrs = {}, host) {
      if (host) {
        const url = `${host}/c/${eci}/event/${domain}/${name}`;

        request(
          {
            method: "POST",
            url,
            headers: { "content-type": "application/json" },
            body: krl.encode(attrs)
          },
          (err, res, body) => {
            if (err) {
              this.log.error(err + ""); // TODO better handling
            }
            // ignore
          }
        );
        return;
      }

      // fire-n-forget event not eventWait
      const eid = await this.rsCtx.event({
        eci,
        domain,
        name,
        data: { attrs },
        time: 0
      });

      return eid;
    }
  )
};

export default ctx;
