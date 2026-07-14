import { EventPolicy, QueryPolicy } from "pico-framework";

/** Keep in sync with uiChannelEventPolicy() in io.picolabs.pico-engine-ui.krl */
export const UI_CHANNEL_EVENT_POLICY: EventPolicy = {
  allow: [
    { domain: "engine_ui", name: "setup" },
    { domain: "engine_ui", name: "box" },
    { domain: "engine_ui", name: "new" },
    { domain: "engine_ui", name: "del" },
    { domain: "engine_ui", name: "install" },
    { domain: "engine_ui", name: "uninstall" },
    { domain: "engine_ui", name: "flush" },
    { domain: "engine_ui", name: "new_channel" },
    { domain: "engine_ui", name: "del_channel" },
    { domain: "engine_ui", name: "update_channel" },
    { domain: "engine_ui", name: "testing_eci" },
    { domain: "engine", name: "started" },
    { domain: "wrangler", name: "subscription" },
    { domain: "wrangler", name: "pending_subscription_approval" },
    { domain: "wrangler", name: "inbound_rejection" },
    { domain: "wrangler", name: "outbound_cancellation" },
    { domain: "wrangler", name: "subscription_cancellation" },
  ],
  deny: [],
};

/** Keep in sync with uiChannelQueryPolicy() in io.picolabs.pico-engine-ui.krl */
export const UI_CHANNEL_QUERY_POLICY: QueryPolicy = {
  allow: [
    { rid: "*", name: "__testing" },
    { rid: "io.picolabs.pico-engine-ui", name: "uiECI" },
    { rid: "io.picolabs.pico-engine-ui", name: "box" },
    { rid: "io.picolabs.pico-engine-ui", name: "pico" },
    { rid: "io.picolabs.pico-engine-ui", name: "logs" },
    { rid: "io.picolabs.pico-engine-ui", name: "testingECI" },
    { rid: "io.picolabs.pico-engine-ui", name: "name" },
    { rid: "io.picolabs.subscription", name: "established" },
    { rid: "io.picolabs.subscription", name: "inbound" },
    { rid: "io.picolabs.subscription", name: "outbound" },
    { rid: "io.picolabs.subscription", name: "wellKnown_Rx" },
  ],
  deny: [],
};

export const UI_CHANNEL_TAGS = ["engine", "ui"] as const;
