import * as React from "react";
import { RulesetSchemaAttr } from "../../types/RulesetSchema";

interface Props {
  name: string;
  meta?: RulesetSchemaAttr;
  defaultValue?: string | number | boolean;
  /** When true, @example / defaults show as placeholder only (Testing tab). */
  exampleAsPlaceholder?: boolean;
}

function exampleHintText(
  defaultValue: string | number | boolean | undefined
): string | undefined {
  if (defaultValue === undefined) return undefined;
  if (typeof defaultValue === "object") {
    return JSON.stringify(defaultValue);
  }
  return String(defaultValue);
}

/** U2: typed Testing fields from schema @attr / @param types. */
const SchemaFormField: React.FC<Props> = ({
  name,
  meta,
  defaultValue,
  exampleAsPlaceholder = false,
}) => {
  const type = meta?.type || "Any";
  const metaPlaceholder =
    [name, type !== "Any" ? type : null, meta?.required ? "required" : null, meta?.description]
      .filter(Boolean)
      .join(" · ") || name;

  const exampleHint = exampleHintText(defaultValue);
  const useHintOnly = exampleAsPlaceholder && exampleHint !== undefined;
  const placeholder = useHintOnly
    ? `${metaPlaceholder} · e.g. ${exampleHint}`
    : metaPlaceholder;

  const dflt = useHintOnly
    ? undefined
    : defaultValue !== undefined
      ? String(defaultValue)
      : undefined;

  if (type === "Boolean") {
    const boolDefault = useHintOnly
      ? ""
      : dflt === "true"
        ? "true"
        : dflt === "false"
          ? "false"
          : "";
    return (
      <select
        name={name}
        className="form-control form-control-sm d-inline-block w-auto mr-1 mb-1"
        defaultValue={boolDefault}
        title={useHintOnly && exampleHint ? `e.g. ${exampleHint}` : undefined}
      >
        <option value="">
          {useHintOnly && exampleHint ? `— (e.g. ${exampleHint})` : "—"}
        </option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (type === "Number") {
    return (
      <input
        type="number"
        name={name}
        className="form-control form-control-sm d-inline-block w-auto mr-1 mb-1"
        placeholder={placeholder}
        defaultValue={dflt}
      />
    );
  }

  if (type === "Map" || type === "Array") {
    return (
      <textarea
        name={name}
        className="form-control form-control-sm d-block mb-1 text-mono"
        rows={2}
        placeholder={placeholder + " (JSON)"}
        defaultValue={
          dflt !== undefined && typeof defaultValue === "object"
            ? JSON.stringify(defaultValue)
            : dflt
        }
      />
    );
  }

  return (
    <input
      type="text"
      name={name}
      className="form-control form-control-sm d-inline-block w-auto mr-1 mb-1"
      placeholder={placeholder}
      defaultValue={dflt}
    />
  );
};

export default SchemaFormField;
