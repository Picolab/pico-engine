import * as React from "react";

/** Read named fields from a schema try form (query args or event attrs). */
export function serializeFormAttrsOrArgs(e: React.FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  const attrs: { [name: string]: unknown } = {};
  for (let i = 0; i < form.elements.length; i++) {
    const elm = form.elements[i] as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null;
    if (elm && elm.name) {
      let val: unknown = elm.value;
      if (val === "") continue;
      if (elm instanceof HTMLInputElement && elm.type === "number") {
        attrs[elm.name] = Number(val);
        continue;
      }
      try {
        val = JSON.parse(String(val));
      } catch {
        // leave as string
      }
      attrs[elm.name] = val;
    }
  }
  return attrs;
}
