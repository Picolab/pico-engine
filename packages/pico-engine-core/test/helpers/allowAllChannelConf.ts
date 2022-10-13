import { ChannelConfig } from "pico-framework";

export const allowAllChannelConf: ChannelConfig = {
  tags: ["allow-all"],
  eventPolicy: {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  },
  queryPolicy: {
    allow: [{ rid: "*", name: "*" }],
    deny: [],
  },
};
