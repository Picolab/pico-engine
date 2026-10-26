import {
  ChannelReadOnly,
  hasUnrestrictedEventAllow,
  hasUnrestrictedQueryAllow,
} from "pico-framework";

import { getEngineRuntimeSettings } from "./engineConfig";

/** See {@link EngineSettings.wildcardSkyRequireBearer} (config file or env). */
export function wildcardSkyRequireBearerEnabled(): boolean {
  return getEngineRuntimeSettings().wildcardSkyRequireBearer;
}

/**
 * True when the channel grants unrestricted events or queries (*.* allow rules).
 * Such channels require an authenticated HTTP caller (OAuth bearer or /c/* session).
 */
export function channelHasUnrestrictedAllow(channel: ChannelReadOnly): boolean {
  return (
    hasUnrestrictedEventAllow(channel.eventPolicy) ||
    hasUnrestrictedQueryAllow(channel.queryPolicy)
  );
}

export function isDidcommIngressChannel(channel: ChannelReadOnly): boolean {
  return (
    channel.tags.includes("didcomm") && channel.tags.includes("ingress")
  );
}
