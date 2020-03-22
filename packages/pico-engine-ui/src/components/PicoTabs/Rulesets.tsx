import * as React from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../Action";
import { PicoBox, PicoDetails } from "../../State";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";

interface Props {
  pico: PicoBox;
}

const Rulesets: React.FC<Props> = ({ pico }) => {
  const [rid, setRid] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<string>("{}");

  // TODO
  // TODO
  const availRulesets: {
    // TODO
    [rid: string]: {
      // TODO
      [version: string]: true;
    };
  } = {};

  function isReadyToInstall(): boolean {
    if (!rid || !version) {
      return false;
    }
    if (!availRulesets[rid] && !availRulesets[rid][version]) {
      return false;
    }
    try {
      JSON.parse(config);
    } catch (err) {
      return false;
    }
    return true;
  }

  const install = useAsyncAction<{
    eci: string;
    rid: string;
    version: string;
    config: any;
  }>(params =>
    apiPost(
      `/c/${params.eci}/event/engine-ui/install/query/io.picolabs.next/pico`,
      {
        rid: params.rid,
        version: params.version,
        config: params.config
      }
    ).then(d => null)
  );

  const uninstall = useAsyncAction<{
    eci: string;
    rid: string;
  }>(({ eci, rid }) =>
    apiPost(`/c/${eci}/event/engine-ui/uninstall/query/io.picolabs.next/pico`, {
      rid
    }).then(d => null)
  );

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.next/pico`)
  );

  React.useEffect(() => {
    picoDetails.load();
  }, [pico.eci]);

  return (
    <div>
      <h3>Installed Rulesets</h3>
      {uninstall.error ? (
        <div className="alert alert-danger">
          Uninstall error: {uninstall.error}
        </div>
      ) : (
        ""
      )}
      {picoDetails.data && picoDetails.data.rulesets.length > 0 ? (
        <ul>
          {picoDetails.data.rulesets.map(rs => {
            return (
              <li key={rs.rid} className="text-mono">
                {rs.rid}@{rs.version}
                {" " + JSON.stringify(rs.config)}
                <button
                  className="btn btn-link btn-sm"
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    uninstall.act({ eci: pico.eci, rid: rs.rid });
                  }}
                  disabled={picoDetails.waiting || uninstall.waiting}
                >
                  uninstall
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <span className="text-muted">- no rulesets -</span>
      )}
      <hr />
      Install Ruleset:
      <form
        onSubmit={e => {
          e.preventDefault();
          if (isReadyToInstall() && rid && version) {
            install.act({
              eci: pico.eci,
              rid,
              version,
              config: JSON.parse(config)
            });
          }
        }}
      >
        <div className="form-row mb-2">
          <div className="col-auto">
            <select
              className="form-control"
              value={rid || "--"}
              onChange={e => setRid(e.target.value)}
            >
              <option value="--" />
              {Object.keys(availRulesets).map(rid => (
                <option key={rid} value={rid}>
                  {rid}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <select
              className="form-control"
              disabled={!availRulesets[rid || ""]}
              value={version || "--"}
              onChange={e => setVersion(e.target.value)}
            >
              <option value="--" />
              {Object.keys(availRulesets[rid || ""] || {}).map(version => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <textarea
            rows={3}
            className="form-control"
            value={config}
            onChange={e => setConfig(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-outline-primary"
          disabled={
            picoDetails.waiting || install.waiting || !isReadyToInstall()
          }
        >
          Install
        </button>
        {install.error ? (
          <span className="text-danger">{install.error}</span>
        ) : (
          ""
        )}
      </form>
    </div>
  );
};

export default Rulesets;
