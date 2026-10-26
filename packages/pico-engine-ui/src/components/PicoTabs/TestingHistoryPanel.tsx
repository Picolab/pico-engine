import * as React from "react";
import { canRunSpec } from "../../testingRunSpec";
import {
  maskSensitivePayload,
  outcomeSummary,
  TestingHistoryEntry,
} from "../../testingHistory";
import CopyToClipboardButton from "../widgets/CopyToClipboardButton";

interface Props {
  entries: TestingHistoryEntry[];
  loading?: boolean;
  filterRid?: string;
  onSave: (entry: TestingHistoryEntry) => void;
  onRerun: (entry: TestingHistoryEntry) => void;
  onCopyExample: (entry: TestingHistoryEntry) => void;
  onClear: (filterRid?: string) => void;
}

const kindBadge = (kind: TestingHistoryEntry["kind"]) => {
  if (kind === "query") {
    return <span className="badge badge-primary ml-1">query</span>;
  }
  if (kind === "event") {
    return <span className="badge badge-warning ml-1">event</span>;
  }
  return <span className="badge badge-secondary ml-1">console</span>;
};

const TestingHistoryPanel: React.FC<Props> = ({
  entries,
  loading,
  filterRid,
  onSave,
  onRerun,
  onCopyExample,
  onClear,
}) => {
  const shown = filterRid
    ? entries.filter((e) => e.rid === filterRid)
    : entries;

  return (
    <details className="mt-3 testing-panel-details" open={shown.length > 0}>
      <summary className="h6 mb-0 testing-panel-summary">
        History ({shown.length})
        {shown.length > 0 ? (
          <button
            type="button"
            className="btn btn-link btn-sm py-0 ml-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear(filterRid);
            }}
          >
            Clear
          </button>
        ) : null}
      </summary>
      {loading ? (
        <div className="small text-muted mt-2">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="small text-muted mt-2">
          Sends from this tab appear here (stored on this pico).
        </div>
      ) : (
        <ul className="list-unstyled small mt-2 mb-0">
          {shown.map((e) => {
            const displayPayload = maskSensitivePayload(e.payload);
            return (
              <li key={e.id} className="border-bottom pb-2 mb-2">
                <div className="d-flex align-items-start">
                  <div className="flex-grow-1 min-width-0">
                    <code>{e.label}</code>
                    {kindBadge(e.kind)}
                  </div>
                  {e.kind === "console" ? (
                    <CopyToClipboardButton
                      text={e.label}
                      className="ml-1 flex-shrink-0"
                    />
                  ) : null}
                </div>
                <div className="text-muted small">{e.time}</div>
                <div className="text-muted text-mono">{e.rid}</div>
                <div
                  className={e.ok ? "text-success" : "text-danger"}
                >
                  {outcomeSummary(e)}
                </div>
                <div className="mt-1">
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mr-2"
                    onClick={() => onSave(e)}
                  >
                    Save
                  </button>
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
                </div>
                {e.result ? (
                  <div className="d-flex align-items-start mt-1">
                    <pre className="small bg-light p-1 mb-0 flex-grow-1">
                      {e.result}
                    </pre>
                    <CopyToClipboardButton
                      text={e.result}
                      className="ml-1 mt-1"
                    />
                  </div>
                ) : null}
                {displayPayload &&
                Object.keys(displayPayload).length > 0 ? (
                  <pre className="small bg-light p-1 mb-0 mt-1">
                    {JSON.stringify(displayPayload, undefined, 2)}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
};

export default TestingHistoryPanel;
