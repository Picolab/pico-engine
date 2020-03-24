import * as React from "react";
import { apiGet, apiPost } from "../../api";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";

interface Props {
  pico: PicoBox;
}

const Rulesets: React.FC<Props> = ({ pico }) => {
  const [url, setUrl] = React.useState<string>("");
  const [config, setConfig] = React.useState<string>("{}");

  function isReadyToInstall(): boolean {
    if (url.trim().length === 0) {
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
    url: string;
    config: any;
  }>(params =>
    apiPost(
      `/c/${params.eci}/event/engine_ui/install/query/io.picolabs.next/pico`,
      {
        url: params.url,
        config: params.config
      }
    ).then(d => null)
  );

  const uninstall = useAsyncAction<{
    eci: string;
    rid: string;
  }>(({ eci, rid }) =>
    apiPost(`/c/${eci}/event/engine_ui/uninstall/query/io.picolabs.next/pico`, {
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
      <ErrorStatus error={picoDetails.error} />
      <ErrorStatus error={uninstall.error} />
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
          if (isReadyToInstall() && url) {
            install.act({
              eci: pico.eci,
              url,
              config: JSON.parse(config)
            });
          }
        }}
      >
        <div className="form-group mb-2">
          <input
            className="form-control"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
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
        <ErrorStatus error={install.error} />
      </form>
    </div>
  );
};

export default Rulesets;
