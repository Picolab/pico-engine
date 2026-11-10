import fetch from "cross-fetch";
import { CurrentPicoEvent, krl, KrlCtx } from "krl-stdlib";

const SEND_ATTR_LIMIT = 2048;

function attrsForSendLog(attrs: unknown): Record<string, unknown> {
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return {};
  const copy: Record<string, unknown> = { ...(attrs as Record<string, unknown>) };
  delete copy._headers;
  delete copy.__eid;
  delete copy.__parent_txn;
  let text: string;
  try {
    const encoded = JSON.stringify(copy);
    if (typeof encoded !== "string") return {};
    text = encoded;
  } catch {
    return { _unloggable: true };
  }
  if (text.length <= SEND_ATTR_LIMIT) return copy;
  return {
    _truncated: true,
    bytes: text.length,
    preview: text.slice(0, 500),
  };
}

function logSend(
  ctx: KrlCtx,
  fields: {
    transport: "local" | "http" | "didcomm";
    domain: string;
    name: string;
    attrs: unknown;
    targetEci?: string;
    targetDid?: string;
    host?: string;
    childTxn?: string;
  }
): void {
  ctx.log.debug("send", {
    transport: fields.transport,
    targetEci: fields.targetEci,
    targetDid: fields.targetDid,
    host: fields.host,
    childTxn: fields.childTxn,
    rule_name: ctx.getCurrentRuleName() || undefined,
    event: {
      eci: fields.targetEci,
      domain: fields.domain,
      name: fields.name,
      data: { attrs: attrsForSendLog(fields.attrs) },
    },
  });
}

function eventProperty<T = any>(
  fn: (event: CurrentPicoEvent) => T
): (ctx: KrlCtx) => T | null {
  return krl.Property(function () {
    let event: any = this.getEvent();
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
      let domain = options.domain;
      let name = options.name || options.type;
      let attrs = options.attrs;
      if (!eci) {
        if (options.sub) {
          const sub = options.sub;
          if (sub.layer2 === true) {
            const did = sub.Tx_did;
            if (!krl.isString(did)) {
              throw new TypeError(
                "layer2 subscription missing Tx_did: " + krl.toString(did)
              );
            }
            await this.krl.assertAction(this.module("dido")!["picoEvent"])(this, [
              did,
              {
                domain,
                name,
                attrs,
              },
            ]);
            logSend(this, {
              transport: "didcomm",
              domain,
              name,
              attrs,
              targetDid: did,
            });
            return;
          }
          eci = sub.Tx;
          host = sub.Tx_host;
        } else if (options.did) {
          await this.krl.assertAction(this.module("dido")!["picoEvent"])(this, [
            options.did,
            {
              domain,
              name,
              attrs,
            },
          ]);
          logSend(this, {
            transport: "didcomm",
            domain,
            name,
            attrs,
            targetDid: options.did,
          });
          return;
        }
      }
      if (!krl.isString(eci)) {
        throw new TypeError(
          "eci was " +
          krl.toString(eci) +
          " instead of a string"
        );
      }
      if (host) {
        const url = `${host}/c/${eci}/event/${domain}/${name}`;
        logSend(this, {
          transport: "http",
          domain,
          name,
          attrs,
          targetEci: eci,
          host,
        });

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
      logSend(this, {
        transport: "local",
        domain,
        name,
        attrs,
        targetEci: eci,
        childTxn: typeof eid === "string" ? eid : undefined,
      });

      return eid;
    }
  ),
};

export default event;
