import * as normalizeUrl from "normalize-url";
import { ChannelConfig, cleanChannelTags, RulesetConfig } from "pico-framework";
import { NewPicoRuleset } from "pico-framework/dist/src/Pico";
import * as request from "request";
import * as krl from "../krl";

interface RulesetCtxInfo {
  rid: string;
  version: string;
  config: RulesetConfig | null;
  url: string;
  meta: RulesetCtxInfoMeta | null;
}

interface RulesetCtxInfoMeta {
  krl: string;
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}

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

  newPico: krl.Action(["rulesets"], async function newPico(rulesets) {
    if (!Array.isArray(rulesets)) {
      throw new TypeError("ctx:newPico expects an array of {url, config}");
    }
    const toInstall: NewPicoRuleset[] = [];
    for (const rs of rulesets) {
      const result = await this.rsRegistry.load(rs.url);
      toInstall.push({
        rs: result.ruleset,
        config: {
          url: rs.url,
          config: rs.config || {}
        }
      });
    }
    const newEci = await this.rsCtx.newPico({
      rulesets: toInstall
    });
    return newEci;
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
      const channel = this.rsCtx.pico().channels.find(c => {
        return (
          search ===
          c.tags
            .slice(0)
            .sort()
            .join(",")
        );
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

  rulesets: krl.Property(function rulesets(): RulesetCtxInfo[] {
    const pico = this.rsCtx.pico();

    const results: RulesetCtxInfo[] = [];

    for (const rs of pico.rulesets) {
      const cached = this.rsRegistry.getCached(rs.config.url);
      results.push({
        rid: rs.rid,
        version: rs.version,
        url: rs.config.url,
        config: rs.config.config,
        meta: cached
          ? {
              krl: cached.krl,
              hash: cached.hash,
              flushed: cached.flushed,
              compiler: cached.compiler
            }
          : null
      });
    }

    return results;
  }),

  install: krl.Action(["url", "config"], async function install(url, config) {
    url = normalizeUrl(url);
    const rs = await this.rsRegistry.flush(url);
    await this.rsCtx.install(rs.ruleset, {
      url: url,
      config: config || {}
    });
  }),

  uninstall: krl.Action(["rid"], async function uninstall(rid) {
    await this.rsCtx.uninstall(rid);
  }),

  flush: krl.Action(["url"], async function flush(url) {
    url = normalizeUrl(url);
    await this.rsRegistry.flush(url);
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
          time: 0
        },
        {
          eci,
          rid,
          name: queryName,
          args
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
      args
    });
  }),

  logs: krl.Function([], async function logs() {
    const entries = await this.getPicoLogs();
    return entries;
  })
};

export default ctx;
