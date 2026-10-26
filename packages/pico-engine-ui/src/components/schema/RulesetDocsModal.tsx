import * as React from "react";
import { apiPost } from "../../api";
import { RulesetSchema } from "../../types/RulesetSchema";
import RulesetDocsContent from "./RulesetDocsContent";

interface Props {
  eci: string;
  rid: string;
  onClose: () => void;
}

const RulesetDocsModal: React.FC<Props> = ({ eci, rid, onClose }) => {
  const [schema, setSchema] = React.useState<RulesetSchema | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [waiting, setWaiting] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    setWaiting(true);
    setError(null);
    setSchema(null);
    apiPost(
      `/c/${eci}/query/io.picolabs.wrangler/rulesetSchema`,
      { rid },
      false
    )
      .then((data) => {
        if (cancelled) return;
        setSchema(data as RulesetSchema);
        setWaiting(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(String(err));
        setWaiting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eci, rid]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal card shadow ruleset-docs-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ruleset-docs-title"
      >
        <div className="card-header d-flex align-items-center justify-content-between py-2">
          <h2 id="ruleset-docs-title" className="h5 mb-0 text-mono">
            {rid}
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="card-body">
          {waiting ? (
            <p className="text-muted mb-0">Loading schema…</p>
          ) : error ? (
            <div className="alert alert-warning mb-0">{error}</div>
          ) : schema ? (
            <RulesetDocsContent schema={schema} picoEci={eci} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RulesetDocsModal;
