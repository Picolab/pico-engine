import * as React from "react";
import { canRunSpec } from "../../testingRunSpec";
import { TestingSavedRequest } from "../../testingSaved";

interface Props {
  entries: TestingSavedRequest[];
  loading?: boolean;
  filterRid?: string;
  onRerun: (entry: TestingSavedRequest) => void;
  onCopyExample: (entry: TestingSavedRequest) => void;
  onDelete: (entry: TestingSavedRequest) => void;
}

const TestingSavedPanel: React.FC<Props> = ({
  entries,
  loading,
  filterRid,
  onRerun,
  onCopyExample,
  onDelete,
}) => {
  const shown = filterRid
    ? entries.filter((e) => e.rid === filterRid)
    : entries;

  return (
    <details className="mt-3 testing-panel-details" open={shown.length > 0}>
      <summary className="h6 mb-0 testing-panel-summary">
        Saved ({shown.length})
      </summary>
      {loading ? (
        <div className="small text-muted mt-2">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="small text-muted mt-2">
          Save a history entry to keep a named request on this pico.
        </div>
      ) : (
        <ul className="list-unstyled small mt-2 mb-0">
          {shown.map((e) => (
            <li key={e.id} className="border-bottom pb-2 mb-2">
              <div>
                <strong>{e.name}</strong>
              </div>
              <div className="text-muted small">{e.savedAt}</div>
              <div>
                <code>{e.label}</code>
              </div>
              <div className="text-muted text-mono">{e.rid}</div>
              <div className="mt-1">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 mr-2"
                  disabled={!canRunSpec(e)}
                  onClick={() => onRerun(e)}
                >
                  Re-run
                </button>
                {e.kind !== "console" ? (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mr-2"
                    onClick={() => onCopyExample(e)}
                  >
                    Copy @example
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-danger"
                  onClick={() => onDelete(e)}
                >
                  Delete
                </button>
              </div>
              {e.payload && Object.keys(e.payload).length > 0 ? (
                <pre className="small bg-light p-1 mb-0 mt-1">
                  {JSON.stringify(e.payload, undefined, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
};

export default TestingSavedPanel;
