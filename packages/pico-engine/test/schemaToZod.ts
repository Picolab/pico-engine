/**
 * Mesh MCP tool arguments built from a pico schema. Array bounds have to
 * reject an oversized value before Zod reads its elements.
 */

import test from "ava";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { zodForAttr, MAX_ATTR_ARRAY } = require("../mcp/schemaToZod.js") as {
  zodForAttr: (attr: {
    type?: string;
    description?: string;
    required?: boolean;
  }) => {
    parse: (value: unknown) => unknown;
    safeParse: (value: unknown) => {
      success: boolean;
      error?: { issues: { code: string }[] };
    };
  };
  MAX_ATTR_ARRAY: number;
};

test("array attributes accept a short list and reject one past the bound", (t) => {
  const field = zodForAttr({
    type: "array",
    description: "ids",
    required: true,
  });
  t.deepEqual(field.parse(["a", 1, null]), ["a", 1, null]);

  const over = field.safeParse(Array(MAX_ATTR_ARRAY + 1).fill(0));
  t.false(over.success);
  if (!over.success) {
    t.is(over.error.issues.length, 1);
    t.is(over.error.issues[0].code, "too_big");
  }
});

test("an optional described array still stops before reading bad elements", (t) => {
  const field = zodForAttr({ type: "array", description: "ids" });
  t.is(field.parse(undefined), undefined);

  // Numbers where a string array is required: one too_big, not one issue per element.
  // .describe() and .optional() wrap the same way schemaToZod does.
  const bounded = z.array(z.string()).max(10).describe("ids").optional();
  const over = bounded.safeParse(Array(5000).fill(0));
  t.false(over.success);
  if (!over.success) {
    t.is(over.error.issues.length, 1);
    t.is(over.error.issues[0].code, "too_big");
  }
});

test("map attributes are string-keyed records", (t) => {
  const field = zodForAttr({ type: "map", required: true });
  t.deepEqual(field.parse({ a: 1, b: "x" }), { a: 1, b: "x" });
});
