import * as React from "react";
import { apiGet, apiPost } from "../../api";
import { KrlSource } from "../../types/KrlSource";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";

interface Props {
  pico: PicoBox;
}

const OAUTH_RULESET_MARK = "io.picolabs.oauth";
const ROOT_ONLY_INSTALL_MESSAGE =
  "io.picolabs.oauth must be installed on the mesh root pico, not a child pico.";

function isRootPico(pico: PicoBox): boolean {
  return pico.parent == null;
}

function isRootOnlyRulesetUrl(url: string): boolean {
  return url.includes(OAUTH_RULESET_MARK);
}

function isRootOnlyInstallBlocked(pico: PicoBox, url: string): boolean {
  return isRootOnlyRulesetUrl(url) && !isRootPico(pico);
}

const Rulesets: React.FC<Props> = ({ pico }) => {
  const [url, setUrl] = React.useState<string>("");
  const [config, setConfig] = React.useState<string>("{}");
  const [installNotice, setInstallNotice] = React.useState<string | null>(null);
  const [expandedRulesets, setExpandedRulesets] = React.useState<{
    [rid_at_version: string]: boolean;
  }>({});

  function isConfigValid(): boolean {
    try {
      JSON.parse(config);
      return true;
    } catch (err) {
      return false;
    }
  }

  function isReadyToInstall(): boolean {
    return url.trim().length > 0 && isConfigValid();
  }

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/pico`)
  );

  const krlSources = useAsyncLoader<{ sources: KrlSource[] } | null>(null, () =>
    apiGet("/api/krl-sources")
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
    krlSources.load();
  }, [pico.eci]);

  const installedRids = new Set(
    (picoDetails.data?.rulesets || []).map((ruleset) => ruleset.rid)
  );

  const availableKrlSources = (krlSources.data?.sources || []).filter(
    (source) => !installedRids.has(source.rid)
  );

  function tryInstall(installUrl: string, parsedConfig: object) {
    if (isRootOnlyInstallBlocked(pico, installUrl)) {
      setInstallNotice(ROOT_ONLY_INSTALL_MESSAGE);
      return;
    }
    setInstallNotice(null);
    install.act({
      eci: pico.eci,
      url: installUrl,
      config: parsedConfig,
    });
  }

  function installFromSource(source: KrlSource) {
    if (!isConfigValid()) {
      return;
    }
    tryInstall(source.url, JSON.parse(config));
  }

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
                        {ruleset.meta.flushed + ""}
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
      <h4>Engine KRL Directory</h4>
      <p className="text-muted">
        Rulesets shipped with this pico-engine install that are not yet on this
        pico. Flush always reloads from the engine&apos;s local <code>krl/</code>{" "}
        directory.
      </p>
      <ErrorStatus error={krlSources.error} />
      {krlSources.waiting ? (
        <span className="text-muted">Loading local rulesets…</span>
      ) : availableKrlSources.length > 0 ? (
        availableKrlSources.map((source) => {
          const key = `krl:${source.rid}`;
          const id = `id-krl-${source.rid}`;
          const isOpen = !!expandedRulesets[key];
          const rootOnlyBlocked = !!source.rootOnly && !isRootPico(pico);
          return (
            <div key={source.relativePath}>
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
                  <span className="text-mono">{source.rid}</span>
                  {source.name ? (
                    <span className="text-muted"> — {source.name}</span>
                  ) : (
                    ""
                  )}
                </label>
              </div>
              {isOpen ? (
                <div className="ml-3 mb-2">
                  <div className="small text-muted">{source.relativePath}</div>
                  {source.rootOnly ? (
                    <div className="small text-warning">Root pico only</div>
                  ) : (
                    ""
                  )}
                  {source.description ? (
                    <div className="small text-muted">{source.description}</div>
                  ) : (
                    ""
                  )}
                  <div>
                    <a href={source.url} target="_blank">
                      {source.url}
                    </a>
                  </div>
                  <div className="mt-1">
                    {rootOnlyBlocked ? (
                      <span className="badge badge-warning text-dark">
                        root only
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        disabled={
                          picoDetails.waiting ||
                          install.waiting ||
                          !isConfigValid()
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          installFromSource(source);
                        }}
                      >
                        install
                      </button>
                    )}{" "}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={picoDetails.waiting || install.waiting}
                      onClick={(e) => {
                        e.preventDefault();
                        setUrl(source.url);
                      }}
                    >
                      use URL
                    </button>
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          );
        })
      ) : krlSources.data ? (
        <span className="text-muted">- all local rulesets installed -</span>
      ) : (
        <span className="text-muted">- no local rulesets found -</span>
      )}
      <hr />
      <h4>Install Ruleset by URL</h4>
      {!isRootPico(pico) && isRootOnlyRulesetUrl(url) ? (
        <p className="text-warning small">{ROOT_ONLY_INSTALL_MESSAGE}</p>
      ) : (
        ""
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isReadyToInstall() && url) {
            tryInstall(url, JSON.parse(config));
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
            placeholder="https://… or file://… or pick from the table above"
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
        <ErrorStatus error={installNotice || install.error} />
      </form>
    </div>
  );
};

export default Rulesets;
