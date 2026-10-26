/** Parse text JSON from an MCP tools/call result. */
export function mcpToolText(result: {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}): string {
  const block = result.content?.find((c) => c.type === "text");
  return block?.text ?? "";
}

export function mcpToolJson<T = unknown>(result: {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}): T {
  const text = mcpToolText(result);
  if (!text) {
    throw new Error("Empty MCP tool result");
  }
  return JSON.parse(text) as T;
}
