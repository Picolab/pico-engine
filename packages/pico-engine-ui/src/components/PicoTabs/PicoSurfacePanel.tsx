import * as React from "react";
import { PicoSchema } from "../../types/PicoSchema";

interface Props {
  schema: PicoSchema | null;
  loading: boolean;
  error: string | null;
}

/** Read-only pico-level discovery aggregate (About tab). */
const PicoSurfacePanel: React.FC<Props> = ({ schema, loading, error }) => {
  if (error) {
    return <div className="alert alert-warning small">{error}</div>;
  }
  if (loading) {
    return <div className="text-muted small mb-2">Loading pico schema…</div>;
  }
  if (!schema) {
    return null;
  }
  const events = schema.events || [];
  const queries = schema.queries || [];
  if (events.length === 0 && queries.length === 0) {
    return (
      <div className="text-muted small mb-2">
        No annotated events or queries on this pico.
      </div>
    );
  }
  return (
    <details className="mb-3">
      <summary>Pico surface (discovery aggregate)</summary>
      <div className="small pl-2 mt-1">
        {schema.conflicts && schema.conflicts.length > 0 ? (
          <div className="alert alert-warning py-1 px-2">
            {schema.conflicts.length} schema conflict(s) — see attrs typed
            differently across rulesets.
          </div>
        ) : null}
        {events.length > 0 ? (
          <>
            <strong>Events</strong>
            <ul className="mb-2">
              {events.map((ev) => (
                <li key={ev.domain + ":" + ev.name}>
                  <code>
                    {ev.domain}:{ev.name}
                  </code>
                  {ev.sources && ev.sources.length ? (
                    <span className="text-muted">
                      {" "}
                      — {ev.sources.map((s) => `${s.rid}:${s.rule}`).join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {queries.length > 0 ? (
          <>
            <strong>Queries</strong>
            <ul className="mb-0">
              {queries.map((q) => (
                <li key={q.rid + ":" + q.name}>
                  <code>
                    {q.rid}:{q.name}
                  </code>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </details>
  );
};

export default PicoSurfacePanel;
