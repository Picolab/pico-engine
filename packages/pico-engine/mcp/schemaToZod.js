"use strict";

const { z } = require("zod");

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
      field = z.array(z.any());
      break;
    case "map":
    case "object":
    case "json":
      field = z.record(z.any());
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

module.exports = { attrsToZodShape, zodForAttr };
