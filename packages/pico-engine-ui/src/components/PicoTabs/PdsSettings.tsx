import * as React from "react";
import { apiGet, apiPost } from "../../api";

interface SecretMark {
  secret: true;
  set: boolean;
}

interface SettingsRecord {
  name?: string;
  rid?: string;
  data?: Record<string, unknown>;
}

function isSecret(value: unknown): value is SecretMark {
  return (
    !!value &&
    typeof value === "object" &&
    (value as SecretMark).secret === true &&
    typeof (value as SecretMark).set === "boolean"
  );
}

/**
 * Ruleset settings from PDS. Secret values are set / not set, with a replace
 * field. The current secret is not shown.
 */
const PdsSettings: React.FC<{ eci: string }> = ({ eci }) => {
  const [records, setRecords] = React.useState<Array<[string, SettingsRecord]>>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  const load = React.useCallback(() => {
    apiGet(`/c/${eci}/query/io.picolabs.pds/settings`)
      .then((body) => {
        const settings = (body && body.settings) || {};
        setRecords(Object.entries(settings));
        setError(null);
      })
      .catch((err) => setError(String(err)));
  }, [eci]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function replaceSecret(rid: string, name: string, key: string) {
    const value = drafts[rid + "\0" + key] || "";
    if (!value) {
      return;
    }
    await apiPost(`/c/${eci}/event-wait/pds/add_settings`, {
      keyed_rid: rid,
      name: name || rid,
      data_key: key,
      value,
      secret: true,
    });
    setDrafts((prev) => ({ ...prev, [rid + "\0" + key]: "" }));
    load();
  }

  if (error) {
    return <p className="text-danger small">{error}</p>;
  }
  if (!records.length) {
    return <p className="text-muted small mb-0">No ruleset settings.</p>;
  }

  return (
    <div>
      {records.map(([rid, record]) => (
        <div key={rid} className="mb-3">
          <div className="font-weight-bold">{record.name || rid}</div>
          <div className="text-muted small text-mono mb-1">{rid}</div>
          {Object.entries(record.data || {}).map(([key, value]) => {
            if (!isSecret(value)) {
              return (
                <div key={key} className="small">
                  <span className="text-mono">{key}</span>: {JSON.stringify(value)}
                </div>
              );
            }
            const draftKey = rid + "\0" + key;
            return (
              <form
                key={key}
                className="form-inline mb-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  void replaceSecret(rid, record.name || rid, key);
                }}
              >
                <span className="text-mono small mr-2">{key}</span>
                <span className="badge badge-secondary mr-2">{value.set ? "set" : "not set"}</span>
                <input
                  type="password"
                  className="form-control form-control-sm mr-2"
                  autoComplete="new-password"
                  placeholder="Replace"
                  value={drafts[draftKey] || ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                  }
                />
                <button type="submit" className="btn btn-sm btn-outline-primary">
                  Replace
                </button>
              </form>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PdsSettings;
