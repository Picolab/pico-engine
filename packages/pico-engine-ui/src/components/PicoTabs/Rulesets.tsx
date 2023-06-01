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
  const [expandedRulesets, setExpandedRulesets] = React.useState<{
    [rid_at_version: string]: boolean;
  }>({});

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

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/pico`)
  );

  const install = useAsyncAction<{
    eci: string;
    url: string;
    config: any;
  }>((params) =>
    apiPost(
      `/c/${params.eci}/event/engine_ui/install/query/io.picolabs.pico-engine-ui/pico`,
      {
        url: params.url,
        config: params.config,
      }
    ).then((d) => {
      picoDetails.setData(d);
      setUrl("");
      setConfig("{}");
    })
  );

  const uninstall = useAsyncAction<{
    eci: string;
    rid: string;
  }>(({ eci, rid }) =>
    apiPost(
      `/c/${eci}/event/engine_ui/uninstall/query/io.picolabs.pico-engine-ui/pico`,
      {
        rid,
      }
    ).then((d) => {
      picoDetails.setData(d);
    })
  );

  const flush = useAsyncAction<{
    eci: string;
    url: string;
  }>(({ eci, url }) =>
    apiPost(
      `/c/${eci}/event/engine_ui/flush/query/io.picolabs.pico-engine-ui/pico`,
      {
        url,
      }
    ).then((d) => {
      picoDetails.setData(d);
    })
  );

  React.useEffect(() => {
    picoDetails.load();
  }, [pico.eci]);

  return (
    <div>
      <h3>Installed Rulesets</h3>
      <ErrorStatus error={picoDetails.error} />
      {picoDetails.data && picoDetails.data.rulesets.length > 0 ? (
        picoDetails.data.rulesets.map((ruleset) => {
          const key = ruleset.rid;
          const id = `id-rid-${key}`;
          const isOpen = !!expandedRulesets[key];
          return (
            <div key={key}>
              <div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    onChange={(e) => {
                      const map = Object.assign({}, expandedRulesets);
                      if (e.target.checked) {
                        map[key] = true;
                      } else {
                        delete map[key];
                      }
                      setExpandedRulesets(map);
                    }}
                    checked={isOpen}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    <span className="text-mono">
                      {ruleset.rid}
                      {ruleset?.meta?.krlMeta?.version
                        ? "@" + ruleset?.meta?.krlMeta?.version
                        : ""}
                    </span>
                  </label>
                </div>
              </div>
              {isOpen ? (
                <div className="ml-3">
                  <div>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        flush.act({ eci: pico.eci, url: ruleset.url });
                      }}
                      disabled={picoDetails.waiting || flush.waiting}
                    >
                      flush
                    </button>{" "}
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        uninstall.act({ eci: pico.eci, rid: ruleset.rid });
                      }}
                      disabled={picoDetails.waiting || uninstall.waiting}
                    >
                      uninstall
                    </button>
                    <ErrorStatus error={flush.error} />
                    <ErrorStatus error={uninstall.error} />
                  </div>
                  <div>
                    <a href={ruleset.url} target="_blank">
                      {ruleset.url}
                    </a>
                  </div>
                  <div>
                    <b className="text-muted">Config:</b>{" "}
                    {JSON.stringify(ruleset.config)}
                  </div>
                  {ruleset.meta && (
                    <div>
                      <div>
                        <b className="text-muted">Last flushed:</b>{" "}
                        {ruleset.meta.flushed}
                      </div>
                      <div>
                        <b className="text-muted">Hash:</b> {ruleset.meta.hash}
                      </div>
                      <div>
                        <b className="text-muted">Compiler version:</b>{" "}
                        {ruleset.meta.compiler.version}
                      </div>
                      <div>
                        <b className="text-muted">Compiler warnings:</b>{" "}
                        {Array.isArray(ruleset.meta.compiler.warnings) ? (
                          <ul>
                            {ruleset.meta.compiler.warnings.map((warning) => {
                              let message = "";
                              if (
                                warning &&
                                typeof warning.message === "string"
                              ) {
                                message = `${
                                  warning.loc?.start
                                    ? `${warning.loc.start.line}:${warning.loc.start.column}: `
                                    : ""
                                }${warning.message}`;
                              } else {
                                message = JSON.stringify(warning);
                              }
                              return <li>{message}</li>;
                            })}
                          </ul>
                        ) : (
                          <span></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                ""
              )}
            </div>
          );
        })
      ) : (
        <span className="text-muted">- no rulesets -</span>
      )}
      <hr />
      <h4>Install Ruleset</h4>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isReadyToInstall() && url) {
            install.act({
              eci: pico.eci,
              url,
              config: JSON.parse(config),
            });
          }
        }}
      >
        <div className="form-group">
          <label htmlFor="new-rs-url">URL</label>
          <input
            id="new-rs-url"
            className="form-control"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={picoDetails.waiting || install.waiting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="new-rs-config">Config</label>
          <textarea
            id="new-rs-config"
            rows={3}
            className="form-control"
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            disabled={picoDetails.waiting || install.waiting}
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
