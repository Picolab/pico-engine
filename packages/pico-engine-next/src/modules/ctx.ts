import {
  ChannelConfig,
  cleanChannelTags,
  EventPolicy,
  QueryPolicy,
  RulesetConfig
} from "pico-framework";
import { NewPicoRuleset } from "pico-framework/dist/src/Pico";
import * as request from "request";
import * as krl from "../krl";

interface RulesetCtxInfo {
  rid: string;
  version: string;
  installed: boolean;
  config: RulesetConfig | null;
  url: string | null;
  flushed: Date | null;
}

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

  newPico: krl.Action(["rulesets"], async function newPico(rulesets: any) {
    if (!Array.isArray(rulesets)) {
      throw new TypeError(
        "ctx:newPico expects an array of {url, installed, config}"
      );
    }
    const toInstall: NewPicoRuleset[] = [];
    const urls: string[] = [];
    for (const rs of rulesets) {
      if (!rs || typeof rs.url !== "string") {
        throw new TypeError(
          "ctx:newPico expects an array of {url, installed, config}"
        );
      }
      urls.push(rs.url);
      if (rs.installed) {
        const result = await this.rsRegistry.load(rs.url);
        toInstall.push({
          rs: result.ruleset,
          config: rs.config || {}
        });
      }
    }
    const newEci = await this.rsCtx.newPico({
      rulesets: toInstall
    });
    for (const url of urls) {
      await this.rsRegistry.subscribe(newEci, url);
    }
    return newEci;
  }),

  channels: krl.Property(function channels() {
    return this.rsCtx.pico().channels;
  }),

  // TODO newChannel
  // TODO putChannel
  // TODO delChannel

  upsertChannel: krl.Action(
    ["tags", "eventPolicy", "queryPolicy"],
    async function upsertChannel(
      tags: string[],
      eventPolicy?: EventPolicy,
      queryPolicy?: QueryPolicy
    ) {
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

  rulesets: krl.Property(async function rulesets(): Promise<RulesetCtxInfo[]> {
    const pico = this.rsCtx.pico();
    const urls = await this.rsRegistry.picoRulesetUrls(pico.id);

    const map: { [rid_at_version: string]: RulesetCtxInfo } = {};

    await Promise.all(
      urls.map(async url => {
        const rs = await this.rsRegistry.load(url);
        const key = `${rs.rid}@${rs.version}`;
        map[key] = {
          rid: rs.rid,
          version: rs.version,
          installed: false,
          config: null,
          url,
          flushed: rs.flushed
        };
      })
    );

    for (const rs of pico.rulesets) {
      const key = `${rs.rid}@${rs.version}`;
      if (!map[key]) {
        map[key] = {
          rid: rs.rid,
          version: rs.version,
          installed: false,
          config: null,
          url: null,
          flushed: null
        };
      }
      map[key].installed = true;
      map[key].config = rs.config;
    }

    return Object.values(map);
  }),

  install: krl.Action(["rid", "version", "config"], async function install(
    rid: string,
    version: string,
    config: any
  ) {
    const pico = this.rsCtx.pico();
    const rs = await this.rsRegistry.loader(pico.id, rid, version);
    await this.rsCtx.install(rs, config);
  }),

  uninstall: krl.Action(["rid"], async function uninstall(rid: string) {
    await this.rsCtx.uninstall(rid);
  }),

  flushRuleset: krl.Action(["url"], async function flushRuleset(url: string) {
    await this.rsRegistry.flush(url);
    await this.rsRegistry.subscribe(this.rsCtx.pico().id, url);
  }),

  addRuleset: krl.Action(["url"], async function addRuleset(url: string) {
    await this.rsRegistry.subscribe(this.rsCtx.pico().id, url);
  }),

  releaseRuleset: krl.Action(["url"], async function releaseRuleset(
    url: string
  ) {
    await this.rsRegistry.unsubscribe(this.rsCtx.pico().id, url);
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
  })
};

export default ctx;
