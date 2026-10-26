import * as React from "react";
import { apiPost } from "../../api";
import { serializeFormAttrsOrArgs } from "../../schemaFormSerialize";
import { RulesetSchemaAttr } from "../../types/RulesetSchema";
import SchemaFormField from "./SchemaFormField";

interface Props {
  rid: string;
  name: string;
  args?: string[];
  defaults?: Record<string, string | number | boolean>;
  exampleName?: string;
  argMeta?: RulesetSchemaAttr[];
  testingEci: string;
  formId?: string;
  className?: string;
  /** When true, show JSON result under the form (Docs). When false, use onResult (Testing). */
  showInlineResult?: boolean;
  exampleAsPlaceholder?: boolean;
  onResult?: (
    result: string | null,
    error: string | null,
    payload?: Record<string, unknown>
  ) => void;
}

const SchemaQueryTryForm: React.FC<Props> = ({
  rid,
  name,
  args,
  defaults,
  exampleName,
  argMeta,
  testingEci,
  formId,
  className = "border border-primary p-2 mb-2",
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
        `/c/${testingEci}/query/${rid}/${name}`,
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

  return (
    <form id={formId} className={className} onSubmit={onSubmit}>
      <div>
        {(args || []).map((arg) => {
          const dflt = defaults && defaults[arg];
          const meta = argMeta?.find((a) => a.name === arg);
          return (
            <SchemaFormField
              key={arg}
              name={arg}
              meta={meta}
              defaultValue={dflt}
              exampleAsPlaceholder={exampleAsPlaceholder}
            />
          );
        })}
      </div>
      <button type="submit" className="btn btn-sm btn-primary" disabled={waiting}>
        {waiting ? "Running…" : name}
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

export default SchemaQueryTryForm;
