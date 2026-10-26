import { defaultsFromExampleRecord } from "./schemaExampleDefaults";
import { TestingSchema } from "./types/TestingSchema";
import { RulesetSchemaOperation } from "./types/RulesetSchema";

/** Event/query forms for one annotated operation (Testing tab). */
export function testingFormsFromOperation(
  op: RulesetSchemaOperation
): Pick<TestingSchema, "events"> {
  const events: NonNullable<TestingSchema["events"]> = [];
  const attrNames = (op.attrs || []).map((a) => a.name);
  const examples = op.examples || [];

  for (const ent of op.entry || []) {
    if (!ent.domain || !ent.name) continue;
    if (examples.length === 0) {
      events.push({
        domain: ent.domain,
        name: ent.name,
        attrs: attrNames.length ? attrNames : undefined,
      });
      continue;
    }
    for (const ex of examples) {
      const defaults = defaultsFromExampleRecord(ex.attrs);
      events.push({
        domain: ent.domain,
        name: ent.name,
        attrs:
          defaults && Object.keys(defaults).length > 0
            ? Object.keys(defaults)
            : attrNames.length
              ? attrNames
              : undefined,
        exampleName: ex.name,
        defaults,
      });
    }
  }
  return { events };
}

export function attrPlaceholder(
  attrs: RulesetSchemaOperation["attrs"],
  name: string
): string {
  const a = (attrs || []).find((x) => x.name === name);
  if (!a) return name;
  const bits = [name];
  if (a.type && a.type !== "Any") bits.push(a.type);
  if (a.required) bits.push("required");
  if (a.description) bits.push(a.description);
  return bits.join(" · ");
}
