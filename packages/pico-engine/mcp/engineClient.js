"use strict";

const fetch = require("cross-fetch");

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

  async getDevLocal() {
    const res = await fetch(`${this.baseUrl}/api/dev/local`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET /api/dev/local ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getUiContext() {
    const res = await fetch(`${this.baseUrl}/api/ui-context`);
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
      "Could not resolve UI channel ECI. Set PICO_ENGINE_UI_ECI, sign in via the UI (same engine), or use localhost with PICO_ENGINE_ALLOW_LOCALHOST_C unset."
    );
  }

  async channelQuery(eci, rid, name, args = {}) {
    const res = await fetch(
      `${this.baseUrl}/c/${encodeURIComponent(eci)}/query/${encodeURIComponent(rid)}/${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
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
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(attrs),
      }
    );
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
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
