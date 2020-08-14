import fetch from "cross-fetch";
import { krl } from "krl-stdlib";
import * as normalizeUrl from "normalize-url";
import {
  ChannelConfig,
  cleanChannelTags,
  NewPicoRuleset,
  RulesetConfig,
} from "pico-framework";
import { PicoEngineCore } from "../PicoEngineCore";

export interface RulesetCtxInfo {
  rid: string;
  config: RulesetConfig | null;
  url: string;
  meta: RulesetCtxInfoMeta | null;
}

export interface RulesetCtxInfoMeta {
  krl: string;
  krlMeta?: {
    version?: string;
    name?: string;
    description?: string;
    author?: string;
  };
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}

export default function initCtxModule(core: PicoEngineCore) {
  function rulesetKrlMetaProperty(key: string) {
    return krl.Property(function () {
      const url = this.rsCtx.ruleset.config["url"];
      const cached = core.rsRegistry.getCached(url);
      const krlMeta = (cached?.ruleset as any).meta || {};
      return krlMeta[key] || null;
    });
  }

  const module: krl.Module = {
    rid: krl.Property(function rid() {
      return this.rsCtx.ruleset.rid;
    }),

    rid_url: krl.Property(function rid_url() {
      return this.rsCtx.ruleset.config["url"];
    }),

    rid_config: krl.Property(function rid_config() {
      return this.rsCtx.ruleset.config["config"];
    }),

    rid_version: rulesetKrlMetaProperty("version"),
    rid_name: rulesetKrlMetaProperty("name"),
    rid_description: rulesetKrlMetaProperty("description"),
    rid_author: rulesetKrlMetaProperty("author"),

    parent: krl.Property(function parent() {
      return this.rsCtx.pico().parent;
    }),

    children: krl.Property(function children() {
      return this.rsCtx.pico().children;
    }),

    newPico: krl.Action(["rulesets"], async function newPico(
      rulesets
    ): Promise<string> {
      if (!Array.isArray(rulesets)) {
        throw new TypeError("ctx:newPico expects an array of {url, config}");
      }
      const toInstall: NewPicoRuleset[] = [];
      for (const rs of rulesets) {
        const result = await core.rsRegistry.load(rs.url);
        toInstall.push({
          rs: result.ruleset,
          config: {
            url: rs.url,
            config: rs.config || {},
          },
        });
      }
      const newEci = await this.rsCtx.newPico({
        rulesets: toInstall,
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

    rulesets: krl.Property(function rulesets(): RulesetCtxInfo[] {
      const pico = this.rsCtx.pico();

      const results: RulesetCtxInfo[] = [];

      for (const rs of pico.rulesets) {
        const cached = core.rsRegistry.getCached(rs.config.url);
        results.push({
          rid: rs.rid,
          url: rs.config.url,
          config: rs.config.config,
          meta: cached
            ? {
                krl: cached.krl,
                krlMeta: (cached?.ruleset as any).meta,
                hash: cached.hash,
                flushed: cached.flushed,
                compiler: cached.compiler,
              }
            : null,
        });
      }

      return results;
    }),

    install: krl.Action(["url", "config"], async function install(
      url: string,
      config: RulesetConfig
    ) {
      if (typeof url !== "string") {
        throw new TypeError(
          "Expected string for url but got " + krl.typeOf(url)
        );
      }
      url = normalizeUrl(url);
      const rs = await core.rsRegistry.load(url);
      await this.rsCtx.install(rs.ruleset, {
        url: url,
        config: config || {},
      });
    }),

    uninstall: krl.Action(["rid"], async function uninstall(rid: string) {
      const pico = this.rsCtx.pico();

      if (typeof rid !== "string") {
        throw new TypeError(
          "Expected string for rid but got " + krl.typeOf(rid)
        );
      }

      const corePico = core.getPico(pico.id);
      if (!corePico) {
        throw new TypeError("Pico not found in core: " + pico.id);
      }

      const usedBy = corePico.whoUses(rid);
      if (usedBy.length > 0) {
        throw new Error(
          `Cannot uninstall ${rid} because ${usedBy.join(
            " and "
          )} depends on it`
        );
      }
      corePico.unUse(rid);
      await this.rsCtx.uninstall(rid);
    }),

    flush: krl.Action(["url"], async function flush(url: string) {
      if (typeof url !== "string") {
        throw new TypeError(
          "Expected string for url but got " + krl.typeOf(url)
        );
      }
      url = normalizeUrl(url);
      await core.rsRegistry.flush(url);
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

  return module;
}
