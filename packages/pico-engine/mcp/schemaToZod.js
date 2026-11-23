"use strict";

const { z } = require("zod");

// Tool arguments are untrusted. Zod 4.6.6+ rejects an array past this bound
// before it reads the elements (GHSA-mrhx-c7xc-m3w5). The bound has to be the
// first check on the array; a later .max() still walks every element.
const MAX_ATTR_ARRAY = 1000;

function zodForAttr(attr) {
  const t = String(attr.type || "string").toLowerCase();
  let field;
  switch (t) {
    case "number":
    case "integer":
    case "int":
      field = z.number();
      break;
    case "boolean":
    case "bool":
      field = z.boolean();
      break;
    case "array":
    case "list":
      field = z.array(z.any()).max(MAX_ATTR_ARRAY);
      break;
    case "map":
    case "object":
    case "json":
      field = z.record(z.string(), z.any());
      break;
    default:
      field = z.string();
  }
  if (attr.description) {
    field = field.describe(attr.description);
  }
  if (attr.pattern && t === "string") {
    try {
      field = field.regex(new RegExp(attr.pattern));
    } catch (_e) {
      // ignore invalid pattern in annotations
    }
  }
  if (!attr.required) {
    field = field.optional();
  }
  return field;
}

/** Build a zod object shape from ruleset schema attrs (event attrs or query args). */
function attrsToZodShape(attrs) {
  const shape = {};
  for (const a of attrs || []) {
    if (!a || !a.name) continue;
    shape[a.name] = zodForAttr(a);
  }
  return shape;
}

module.exports = { attrsToZodShape, zodForAttr, MAX_ATTR_ARRAY };
