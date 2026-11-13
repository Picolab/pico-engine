import { krl, KrlCtx } from "krl-stdlib";
import { Telnet } from "telnet-client";
import type { PicoFramework } from "pico-framework";

const OPTION_NAMES = [
  "host",
  "port",
  "timeout",
  "shellPrompt",
  "loginPrompt",
  "passwordPrompt",
  "failedLoginMatch",
  "initialLFCR",
  "username",
  "password",
  "irs",
  "ors",
  "echoLines",
  "stripShellPrompt",
  "negotiationMandatory",
  "sendTimeout",
  "execTimeout",
  "maxBufferLength",
  "pageSeparator",
];

const DEFAULTS = {
  host: "127.0.0.1",
  port: 23,
  initialLFCR: true,
  timeout: 1800000,
};

interface Connection {
  client: Telnet;
  params: { [name: string]: any };
}

function publicParams(params: { [name: string]: any }) {
  const { password, ...rest } = params;
  return rest;
}

/** One connection per pico; telnet events go to the channel the connect came in on. */
export default function initTelnetModule(pf: PicoFramework) {
  const connections = new Map<string, Connection>();
  const lastParams = new Map<string, { [name: string]: any }>();

  function raise(eci: string | null, name: string, attrs: { [name: string]: any } = {}) {
    if (!eci) {
      return;
    }
    try {
      pf.getPico(eci).event({ eci, domain: "telnet", name, data: { attrs }, time: 0 });
    } catch (err) {}
  }

  function connection(ctx: KrlCtx, fn: string): Connection {
    const conn = connections.get(ctx.rsCtx.pico().id);
    if (!conn) {
      throw new Error("telnet:" + fn + " needs a connection; use telnet:connect first");
    }
    return conn;
  }

  async function send(ctx: KrlCtx, fn: string, command: any): Promise<string> {
    if (!krl.isString(command)) {
      throw new TypeError("telnet:" + fn + " needs a command string");
    }
    return connection(ctx, fn).client.send(command);
  }

  async function close(picoId: string) {
    const conn = connections.get(picoId);
    connections.delete(picoId);
    if (conn) {
      await conn.client.end().catch(() => conn.client.destroy());
    }
  }

  const module: krl.Module = {
    parameters: krl.Function([], function () {
      return publicParams(lastParams.get(this.rsCtx.pico().id) || DEFAULTS);
    }),

    host: krl.Function([], function () {
      return (lastParams.get(this.rsCtx.pico().id) || DEFAULTS).host;
    }),

    connect: krl.Action(["params"], async function (params) {
      const picoId = this.rsCtx.pico().id;
      const event = this.getEvent();
      const eci = event ? event.eci : null;
      const opts: { [name: string]: any } = { ...DEFAULTS };
      if (krl.isMap(params)) {
        for (const name of OPTION_NAMES) {
          if (params[name] !== undefined && params[name] !== null) {
            opts[name] = params[name];
          }
        }
      }
      await close(picoId);
      lastParams.set(picoId, opts);

      const client = new Telnet();
      const conn = { client, params: opts };
      client.on("ready", () => raise(eci, "ready"));
      client.on("failedlogin", () => raise(eci, "failedlogin"));
      client.on("timeout", () => raise(eci, "socket_timeout", { duration: opts.timeout }));
      client.on("error", (err) => raise(eci, "error", { message: String(err && err.message ? err.message : err) }));
      client.on("close", () => {
        if (connections.get(picoId) === conn) {
          connections.delete(picoId);
          raise(eci, "closed");
        }
      });
      try {
        await client.connect(opts);
      } catch (err: any) {
        await client.destroy().catch(() => null);
        return { connected: false, host: opts.host, port: opts.port, error: String(err && err.message ? err.message : err) };
      }
      connections.set(picoId, conn);
      return { connected: true, host: opts.host, port: opts.port };
    }),

    disconnect: krl.Action([], async function () {
      await close(this.rsCtx.pico().id);
      return null;
    }),

    sendCMD: krl.Action(["command"], async function (command) {
      return send(this, "sendCMD", command);
    }),

    query: krl.Function(["command"], async function (command) {
      return send(this, "query", command);
    }),
  };

  return module;
}
