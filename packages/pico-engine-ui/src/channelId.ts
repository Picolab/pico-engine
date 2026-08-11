export const CUSTOM_CHANNEL_ID_MIN_LENGTH = 12;
export const CUSTOM_CHANNEL_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function suggestChannelId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function validateChannelIdInput(id: string): string | null {
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return "Channel id cannot be empty.";
  }
  if (trimmed.length < CUSTOM_CHANNEL_ID_MIN_LENGTH) {
    return `Channel id must be at least ${CUSTOM_CHANNEL_ID_MIN_LENGTH} characters.`;
  }
  if (!CUSTOM_CHANNEL_ID_PATTERN.test(trimmed)) {
    return "Channel id may only contain letters, digits, hyphen, and underscore.";
  }
  return null;
}
