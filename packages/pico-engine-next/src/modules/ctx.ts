import { ChannelConfig, cleanChannelTags } from "pico-framework";
import * as request from "request";
import * as krl from "../krl";

const ctx: krl.Module = {
  rid: krl.Property(function rid() {
    return this.rsCtx.ruleset.rid;
  }),

  rid_version: krl.Property(function rid_version() {
    return this.rsCtx.ruleset.version;
  }),

  rid_url: krl.Property(function rid_url() {
    return this.rsCtx.ruleset.config["url"];
  }),

  rid_config: krl.Property(function rid_config() {
    return this.rsCtx.ruleset.config["config"];
  }),

  parent: krl.Property(function parent() {
    return this.rsCtx.pico().parent;
  }),

  children: krl.Property(function children() {
    return this.rsCtx.pico().children;
  }),

  newPico: krl.Action(["rulesets"], function newPico(rulesets) {
    return this.newPico(rulesets);
  }),

  delPico: krl.Action(["eci"], async function delPico(eci) {
    await this.rsCtx.delPico(eci);
  }),

  channels: krl.Property(function channels() {
    return this.rsCtx.pico().channels;
  }),

  newChannel: krl.Action(
    ["tags", "eventPolicy", "queryPolicy"],
    async function newChannel(tags, eventPolicy, queryPolicy) {
      const conf: ChannelConfig = { tags, eventPolicy, queryPolicy };
      const chann = await this.rsCtx.newChannel(conf);
      return chann;
    }
  ),

  putChannel: krl.Action(
    ["eci", "tags", "eventPolicy", "queryPolicy"],
    async function putChannel(eci, tags, eventPolicy, queryPolicy) {
      const conf: ChannelConfig = { tags, eventPolicy, queryPolicy };
      await this.rsCtx.putChannel(eci, conf);
    }
  ),

  upsertChannel: krl.Action(
    ["tags", "eventPolicy", "queryPolicy"],
    async function upsertChannel(tags, eventPolicy, queryPolicy) {
      tags = cleanChannelTags(tags);
      tags.sort();
      const search = tags.join(",");
      const channel = this.rsCtx.pico().channels.find((c) => {
        return search === c.tags.slice(0).sort().join(",");
      });
      const conf: ChannelConfig = { tags, eventPolicy, queryPolicy };
      if (channel) {
        await this.rsCtx.putChannel(channel.id, conf);
      } else {
        await this.rsCtx.newChannel(conf);
      }
    }
  ),

  delChannel: krl.Action(["eci"], async function delChannel(eci) {
    await this.rsCtx.delChannel(eci);
  }),

  rulesets: krl.Property(function rulesets() {
    return this.rulesets();
  }),

  install: krl.Action(["url", "config"], function install(url, config) {
    return this.install(url, config);
  }),

  uninstall: krl.Action(["rid"], function uninstall(rid) {
    return this.uninstall(rid);
  }),

  flush: krl.Action(["url"], function flush(url) {
    return this.flush(url);
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
            body: krl.encode(attrs),
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
        time: 0,
      });

      return eid;
    }
  ),

  eventQuery: krl.Action(
    ["eci", "domain", "name", "attrs", "rid", "queryName", "args"],
    async function event(
      eci,
      domain,
      name,
      attrs = {},
      rid,
      queryName,
      args = {}
    ) {
      return this.rsCtx.eventQuery(
        {
          eci,
          domain,
          name,
          data: { attrs },
          time: 0,
        },
        {
          eci,
          rid,
          name: queryName,
          args,
        }
      );
    }
  ),

  query: krl.Function(["eci", "rid", "name", "args"], async function query(
    eci,
    rid,
    name,
    args = {}
  ) {
    return this.rsCtx.query({
      eci,
      rid,
      name,
      args,
    });
  }),

  logs: krl.Function([], async function logs() {
    const entries = await this.getPicoLogs();
    return entries;
  }),
};

export default ctx;
