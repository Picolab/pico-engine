"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const fetch = require("cross-fetch");

// Same file the engine writes in src/internalAccess.ts (INTERNAL_TOKEN_FILENAME).
const INTERNAL_TOKEN_FILENAME = "internal-token";

function engineHome() {
  const fromEnv = process.env.PICO_ENGINE_HOME;
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv.replace(/^~(?=$|\/)/, os.homedir());
  }
  return path.join(os.homedir(), ".pico-engine");
}

function readInternalToken() {
  try {
    const token = fs
      .readFileSync(path.join(engineHome(), INTERNAL_TOKEN_FILENAME), "utf8")
      .trim();
    return token.length > 0 ? token : "";
  } catch (_err) {
    return "";
  }
}

function normalizeBaseUrl(url) {
  return url.replace(/\/$/, "");
}

class EngineClient {
  constructor(opts = {}) {
    const port = process.env.PORT || "3000";
    this.baseUrl = normalizeBaseUrl(
      opts.baseUrl ||
        process.env.PICO_ENGINE_BASE_URL ||
        `http://localhost:${port}`
    );
    this.uiEciOverride = opts.uiEci || process.env.PICO_ENGINE_UI_ECI;
    this.uiEciCached = undefined;
  }

  internalHeaders(extra = {}) {
    const headers = { ...extra };
    const token = readInternalToken();
    if (token) {
      headers["X-Pico-Internal"] = token;
    }
    return headers;
  }

  async getDevLocal() {
    const res = await fetch(`${this.baseUrl}/api/dev/local`, {
      headers: this.internalHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET /api/dev/local ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getUiContext() {
    const res = await fetch(`${this.baseUrl}/api/ui-context`, {
      headers: this.internalHeaders(),
    });
    if (!res.ok) {
      throw new Error(`GET /api/ui-context ${res.status}`);
    }
    return res.json();
  }

  async resolveUiEci() {
    if (this.uiEciOverride) {
      return this.uiEciOverride;
    }
    if (this.uiEciCached) {
      return this.uiEciCached;
    }
    try {
      const dev = await this.getDevLocal();
      if (dev.rootUiEci) {
        this.uiEciCached = dev.rootUiEci;
        return dev.rootUiEci;
      }
    } catch (_err) {
      // fall through
    }
    const ctx = await this.getUiContext();
    if (ctx.eci) {
      this.uiEciCached = ctx.eci;
      return ctx.eci;
    }
    throw new Error(
      "Could not resolve UI channel ECI. Set PICO_ENGINE_UI_ECI, or point PICO_ENGINE_HOME at the running engine's data directory so the internal token can be read."
    );
  }

  async channelQuery(eci, rid, name, args = {}) {
    const res = await fetch(
      `${this.baseUrl}/c/${encodeURIComponent(eci)}/query/${encodeURIComponent(rid)}/${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: this.internalHeaders({
          "Content-Type": "application/json; charset=utf-8",
        }),
        body: JSON.stringify(args),
      }
    );
    const text = await res.text();
    if (!text) return null;
    const data = JSON.parse(text);
    if (!res.ok) {
      throw new Error(
        data && typeof data === "object" && data.error != null
          ? String(data.error)
          : text
      );
    }
    return data;
  }

  async channelEventWait(eci, domain, name, attrs = {}) {
    const res = await fetch(
      `${this.baseUrl}/c/${encodeURIComponent(eci)}/event-wait/${encodeURIComponent(domain)}/${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: this.internalHeaders({
          "Content-Type": "application/json; charset=utf-8",
        }),
        body: JSON.stringify(attrs),
      }
    );
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  async getTryIt() {
    const res = await fetch(`${this.baseUrl}/api/try-it`, {
      headers: this.internalHeaders(),
    });
    if (!res.ok) {
      throw new Error(`GET /api/try-it ${res.status}`);
    }
    return res.json();
  }

  async engineUiEvent(name, attrs = {}) {
    const ui = await this.resolveUiEci();
    return this.channelEventWait(ui, "engine_ui", name, attrs);
  }

  async evalKrl(targetEci, rid, expr) {
    return this.channelQuery(targetEci, rid, "__consoleEval", { expr });
  }

  async listPicoBoxes() {
    const ui = await this.resolveUiEci();
    const out = [];
    const walk = async (client, eci) => {
      const box = await client.channelQuery(
        eci,
        "io.picolabs.pico-engine-ui",
        "box"
      );
      out.push(box);
      const children = (box && box.children) || [];
      for (const child of children) {
        await walk(client, child);
      }
    };
    await walk(this, ui);
    return out;
  }
}

function jsonText(data) {
  return JSON.stringify(data, null, 2);
}

module.exports = { EngineClient, jsonText };
