import * as React from "react";
import { Link } from "react-router-dom";
import { precheckSummaryLine } from "../../schemaEmitText";
import { testingTrySearch } from "../../testingTryParams";
import {
  descriptionParagraphs,
  emitDocsLine,
  emitShownInDocs,
  isDuplicateOperationTitle,
  operationEntryLabel,
  operationTitleCounts,
  queryParamSig,
} from "../../schemaDocsText";
import {
  RulesetSchema,
  RulesetSchemaOperation,
  RulesetSchemaQuery,
} from "../../types/RulesetSchema";
import SchemaAttrTable from "./SchemaAttrTable";

interface Props {
  schema: RulesetSchema;
  picoEci: string;
}

function jumpToDocsSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function RulesetDocsIndex({
  ops,
  queries,
  dupCounts,
}: {
  ops: RulesetSchemaOperation[];
  queries: RulesetSchemaQuery[];
  dupCounts: Map<string, number>;
}) {
  if (ops.length === 0 && queries.length === 0) {
    return null;
  }
  const total = ops.length + queries.length;
  return (
    <details className="ruleset-docs-index mb-3 small border rounded bg-light">
      <summary className="p-2 font-weight-bold user-select-none">
        On this page ({total})
      </summary>
      <nav className="px-2 pb-2" aria-label="Ruleset reference index">
        {ops.length > 0 ? (
          <>
            <div className="text-muted text-uppercase mb-1 mt-1">Operations</div>
            <ul className="list-unstyled mb-2">
              {ops.map((op) => {
                const label = operationEntryLabel(op);
                const dup = isDuplicateOperationTitle(op, dupCounts);
                return (
                  <li key={op.rule} className="mb-1">
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-left align-baseline"
                      onClick={() => jumpToDocsSection(`op-${op.rule}`)}
                    >
                      {label}
                      {dup ? (
                        <span className="text-muted"> ({op.rule})</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        {queries.length > 0 ? (
          <>
            <div className="text-muted text-uppercase mb-1">Queries</div>
            <ul className="list-unstyled mb-0">
              {queries.map((q) => {
                const sig = queryParamSig(q.args);
                return (
                  <li key={q.name} className="mb-1">
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-left text-mono align-baseline"
                      onClick={() => jumpToDocsSection(`q-${q.name}`)}
                    >
                      {q.name}({sig})
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </nav>
    </details>
  );
}

function DescriptionBlock({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const paras = descriptionParagraphs(text);
  return (
    <div className="ruleset-docs-description mb-2">
      {paras.map((p, i) => (
        <p
          key={i}
          className={[className, i > 0 ? "mt-4" : "", "mb-0"].join(" ").trim()}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function OperationSection({
  op,
  dup,
  rid,
  picoEci,
}: {
  op: RulesetSchemaOperation;
  dup: boolean;
  rid: string;
  picoEci: string;
}) {
  const title = operationEntryLabel(op);
  const emits = (op.emits || []).filter(emitShownInDocs);
  return (
    <section className="ruleset-docs-op mb-4" id={`op-${op.rule}`}>
      <h4 className="h5">
        {title}
        {dup ? (
          <span className="text-muted font-weight-normal"> ({op.rule})</span>
        ) : null}
      </h4>
      {op.description ? (
        <DescriptionBlock text={op.description} className="text-muted" />
      ) : null}
      <p className="small mb-1">
        <strong>Send:</strong>{" "}
        {(op.entry || [])
          .filter((e) => e.domain && e.name)
          .map((e) => `${e.domain}:${e.name}`)
          .join(", or ") || "—"}
      </p>
      <p className="small mb-2">
        <strong>Rule:</strong> <code>{op.rule}</code>
      </p>
      <SchemaAttrTable columns="attrs" rows={op.attrs || []} />
      {op.examples && op.examples.length > 0 ? (
        <div className="mb-2">
          <strong className="small">Examples</strong>
          <ul className="small mb-0">
            {op.examples.map((ex) => (
              <li key={ex.name} className="mb-1">
                <strong>{ex.name}:</strong>{" "}
                <code>{JSON.stringify(ex.attrs)}</code>
                <Link
                  to={`/pico/${picoEci}/testing${testingTrySearch({
                    rid,
                    rule: op.rule,
                    example: ex.name,
                  })}`}
                  className="btn btn-sm btn-outline-primary ml-2 py-0"
                >
                  Try it
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (op.entry || []).some((e) => e.domain && e.name) ? (
        <p className="small mb-2">
          <Link
            to={`/pico/${picoEci}/testing${testingTrySearch({
              rid,
              rule: op.rule,
            })}`}
            className="btn btn-sm btn-outline-primary py-0"
          >
            Try in Testing
          </Link>
        </p>
      ) : null}
      <p className="small mb-1">
        <strong>Acts when:</strong>{" "}
        {op.condition ? (
          <code>{op.condition}</code>
        ) : (
          "always, once selected"
        )}
      </p>
      {op.prechecks && op.prechecks.length > 0 ? (
        <p className="small mb-2">
          <strong>Check first:</strong>{" "}
          {op.prechecks.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 ? ", " : ""}
              <code>{precheckSummaryLine(p as Record<string, unknown>)}</code>
            </React.Fragment>
          ))}
        </p>
      ) : null}
      {emits.length > 0 ? (
        <>
          <p className="small mb-1">
            <strong>May emit</strong> (possible, not guaranteed):
          </p>
          <ul className="small pl-3">
            {emits.map((em, i) => (
              <li key={i}>
                {emitDocsLine(em as Record<string, unknown>, op.condition)}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {op.alsoSelectedBy && op.alsoSelectedBy.length > 0 ? (
        <>
          <p className="small mb-1">
            <strong>Other rules on the same event:</strong>
          </p>
          <ul className="small pl-3 mb-2">
            {op.alsoSelectedBy.map((peer) => {
              const sel = (peer.select || "")
                .replace(/\s+/g, " ")
                .replace(/^select when /, "");
              return (
                <li key={peer.rule}>
                  <code>{peer.rule}</code>
                  {peer.condition ? (
                    <span>
                      {" "}
                      — acts when <code>{peer.condition}</code>
                    </span>
                  ) : /\bwhere\b|re#/.test(sel) ? (
                    <span>
                      {" "}
                      — selects only <code>{sel}</code>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      {op.select ? (
        <details className="small">
          <summary>Select expression</summary>
          <pre className="small bg-light p-2 text-mono mb-0">{op.select}</pre>
        </details>
      ) : null}
    </section>
  );
}

function QuerySection({
  q,
  rid,
  picoEci,
}: {
  q: RulesetSchemaQuery;
  rid: string;
  picoEci: string;
}) {
  const sig = queryParamSig(q.args);
  const qs = (q.args || []).map((a) => `${a.name}=…`).join("&");
  const examples = q.examples || [];
  return (
    <section className="ruleset-docs-query mb-4" id={`q-${q.name}`}>
      <h4 className="h5">
        <code>
          {q.name}({sig})
        </code>
        {q.returns ? <> → {q.returns}</> : null}
      </h4>
      {q.description ? (
        <DescriptionBlock text={q.description} className="text-muted" />
      ) : null}
      <SchemaAttrTable columns="params" rows={q.args || []} />
      {examples.length > 0 ? (
        <div className="mb-2">
          <strong className="small">Examples</strong>
          <ul className="small mb-0">
            {examples.map((ex) => (
              <li key={ex.name} className="mb-1">
                <strong>{ex.name}:</strong>{" "}
                <code>{JSON.stringify(ex.args)}</code>
                <Link
                  to={`/pico/${picoEci}/testing${testingTrySearch({
                    rid,
                    query: q.name,
                    example: ex.name,
                  })}`}
                  className="btn btn-sm btn-outline-primary ml-2 py-0"
                >
                  Try it
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="small mb-2">
        <Link
          to={`/pico/${picoEci}/testing${testingTrySearch({
            rid,
            query: q.name,
          })}`}
          className="btn btn-sm btn-outline-primary py-0"
        >
          Try in Testing
        </Link>
      </p>
      <p className="small text-muted mb-0">
        <strong>Call:</strong>{" "}
        <code>
          GET /sky/query/&lt;eci&gt;/{rid}/{q.name}
          {qs ? `?${qs}` : ""}
        </code>
      </p>
    </section>
  );
}

const RulesetDocsContent: React.FC<Props> = ({ schema, picoEci }) => {
  const ops = schema.operations || [];
  const queries = schema.queries || [];
  const dupCounts = operationTitleCounts(ops);

  if (ops.length === 0 && queries.length === 0) {
    return (
      <div className="text-muted">
        <p>
          This ruleset has no annotated operations or shared queries on this
          pico. Annotations are opt-in: add a <code>/** … */</code> block
          immediately above a rule or shared function to make it discoverable.
        </p>
        <p className="mb-0">
          See{" "}
          <a href="/docs/#/krl/discovery" target="_blank" rel="noreferrer">
            KRL discovery
          </a>{" "}
          in the engine docs.
        </p>
      </div>
    );
  }

  return (
    <div className="ruleset-docs-content">
      {schema.description ? (
        <DescriptionBlock text={schema.description} className="lead" />
      ) : null}
      <p className="small text-muted mb-1">
        <strong>Version:</strong> {schema.rid_version || "draft"}
      </p>
      <p className="small text-muted mb-2">
        This reference is built from the ruleset as installed on this pico,
        not from a saved Markdown file. If you edit doc comments in the KRL
        source, use <strong>Flush</strong> on the Rulesets tab so this view
        picks up your changes.
      </p>
      <RulesetDocsIndex ops={ops} queries={queries} dupCounts={dupCounts} />
      {ops.length > 0 ? (
        <>
          <h3 className="mt-4 mb-2">Operations</h3>
          <p className="small text-muted">
            Events you can send to a pico with this ruleset installed. Whether
            an operation acts, and what it emits, depends on its condition and
            the pico&apos;s state when the event arrives.
          </p>
          {ops.map((op) => (
            <OperationSection
              key={op.rule}
              op={op}
              dup={isDuplicateOperationTitle(op, dupCounts)}
              rid={schema.rid}
              picoEci={picoEci}
            />
          ))}
        </>
      ) : null}
      {queries.length > 0 ? (
        <>
          <h3 className="mt-4 mb-2">Queries</h3>
          {queries.map((q) => (
            <QuerySection
              key={q.name}
              q={q}
              rid={schema.rid}
              picoEci={picoEci}
            />
          ))}
        </>
      ) : null}
    </div>
  );
};

export default RulesetDocsContent;
