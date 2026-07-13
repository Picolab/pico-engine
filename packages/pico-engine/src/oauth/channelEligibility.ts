import { ChannelReadOnly } from "pico-framework";

export const OAUTH_WEBHOOK_TAG = "oauth-webhook";

const SUBSCRIPTION_CHANNEL_TAGS = new Set([
  "wellknown_rx",
  "tx_rx",
  "subscription",
]);

export function isSubscriptionChannel(tags: string[]): boolean {
  return tags.some((tag) => SUBSCRIPTION_CHANNEL_TAGS.has(tag.toLowerCase()));
}

export function isOAuthEligibleChannel(channel: ChannelReadOnly): boolean {
  if (channel.familyChannelPicoID) {
    return false;
  }
  if (channel.tags.includes("system")) {
    return false;
  }
  if (isSubscriptionChannel(channel.tags)) {
    return false;
  }
  return channel.tags.includes(OAUTH_WEBHOOK_TAG);
}
