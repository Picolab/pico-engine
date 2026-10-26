import * as React from "react";
import { apiPost } from "../../api";
import { serializeFormAttrsOrArgs } from "../../schemaFormSerialize";
import { RulesetSchemaAttr } from "../../types/RulesetSchema";
import SchemaFormField from "./SchemaFormField";

interface Props {
  domain: string;
  name: string;
  attrs?: string[];
  defaults?: Record<string, string | number | boolean>;
  exampleName?: string;
  attrMeta?: RulesetSchemaAttr[];
  testingEci: string;
  formId?: string;
  className?: string;
  showInlineResult?: boolean;
  exampleAsPlaceholder?: boolean;
  onResult?: (
    result: string | null,
    error: string | null,
    payload?: Record<string, unknown>
  ) => void;
}

const SchemaEventTryForm: React.FC<Props> = ({
  domain,
  name,
  attrs,
  defaults,
  exampleName,
  attrMeta,
  testingEci,
  formId,
  className = "border border-warning p-2 mt-1",
  showInlineResult = false,
  exampleAsPlaceholder = false,
  onResult,
}) => {
  const [waiting, setWaiting] = React.useState(false);
  const [inlineResult, setInlineResult] = React.useState<string | null>(null);
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = serializeFormAttrsOrArgs(e);
    setWaiting(true);
    setInlineResult(null);
    setInlineError(null);
    onResult?.(null, null);
    try {
      const data = await apiPost(
        `/c/${testingEci}/event-wait/${domain}/${name}`,
        body,
        false
      );
      const text = JSON.stringify(data, undefined, 2);
      if (showInlineResult) setInlineResult(text);
      else onResult?.(text, null, body);
    } catch (err) {
      const msg = String(err);
      if (showInlineResult) setInlineError(msg);
      else onResult?.(null, msg, body);
    } finally {
      setWaiting(false);
    }
  }

  const doname = `${domain}:${name}`;

  return (
    <form id={formId} className={className} onSubmit={onSubmit}>
      <div>
        {(attrs || []).map((attr) => {
          const dflt = defaults && defaults[attr];
          const meta = attrMeta?.find((a) => a.name === attr);
          return (
            <SchemaFormField
              key={attr}
              name={attr}
              meta={meta}
              defaultValue={dflt}
              exampleAsPlaceholder={exampleAsPlaceholder}
            />
          );
        })}
      </div>
      <button type="submit" className="btn btn-sm btn-warning" disabled={waiting}>
        {waiting ? "Sending…" : doname}
        {exampleName ? ` (${exampleName})` : ""}
      </button>
      {showInlineResult && inlineError ? (
        <pre className="small text-danger mt-2 mb-0">{inlineError}</pre>
      ) : null}
      {showInlineResult && inlineResult ? (
        <pre className="small bg-light p-2 mt-2 mb-0">{inlineResult}</pre>
      ) : null}
    </form>
  );
};

export default SchemaEventTryForm;
