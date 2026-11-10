import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../../api";
import { KrlSource } from "../../types/KrlSource";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";
import TabPageHeader from "../widgets/TabPageHeader";
import {
  flushFailureMessage,
  installFailureMessage,
} from "../../installFlushErrors";
import RulesetDocsModal from "../schema/RulesetDocsModal";
import { RulesetSchema } from "../../types/RulesetSchema";

type ViewPickerState = {
  rid: string;
  rulesetSchema: RulesetSchema | null;
  loading: boolean;
  error: string | null;
};

interface Props {
  pico: PicoBox;
  /** When false, Docs modal is hidden (e.g. user is on Testing) but state is kept. */
  isTabActive?: boolean;
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

const Rulesets: React.FC<Props> = ({ pico, isTabActive = true }) => {
  const [searchParams] = useSearchParams();
  const focusRid = searchParams.get("rid") || "";
  const [url, setUrl] = React.useState<string>("");
  const [config, setConfig] = React.useState<string>("{}");
  const [installNotice, setInstallNotice] = React.useState<string | null>(null);
  const [expandedRulesets, setExpandedRulesets] = React.useState<{
    [rid_at_version: string]: boolean;
  }>({});

  const [docsRid, setDocsRid] = React.useState<string | null>(null);
  const [browseError, setBrowseError] = React.useState<string | null>(null);
  const [viewPicker, setViewPicker] = React.useState<ViewPickerState | null>(
    null
  );
  const [viewChannelEci, setViewChannelEci] = React.useState<string>(pico.eci);
  const krlFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setViewChannelEci(pico.eci);
  }, [pico.eci]);

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

  async function onKrlFileSelected(file: File | undefined) {
    if (!file) {
      return;
    }
    setBrowseError(null);
    try {
      const content = await file.text();
      const staged = await apiPost("/api/stage-krl", {
        content,
        filename: file.name,
      });
      if (staged?.url) {
        setUrl(staged.url);
      }
    } catch (err) {
      setBrowseError(err instanceof Error ? err.message : String(err));
    } finally {
      if (krlFileInputRef.current) {
        krlFileInputRef.current.value = "";
      }
    }
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
    apiPost(`/c/${params.eci}/event-wait/engine_ui/install`, {
      url: params.url,
      config: params.config,
    })
      .then((waitBody) => {
        const msg = installFailureMessage(waitBody);
        if (msg) {
          throw new Error(msg);
        }
        return apiPost(
          `/c/${params.eci}/query/io.picolabs.pico-engine-ui/pico`,
          {}
        );
      })
      .then((d) => {
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
    apiPost(`/c/${eci}/event-wait/engine_ui/flush`, { url })
      .then((waitBody) => {
        const msg = flushFailureMessage(waitBody);
        if (msg) {
          throw new Error(msg);
        }
        return apiPost(
          `/c/${eci}/query/io.picolabs.pico-engine-ui/pico`,
          {}
        );
      })
      .then((d) => {
        picoDetails.setData(d);
      })
  );

  React.useEffect(() => {
    picoDetails.load();
    krlSources.load();
  }, [pico.eci]);

  const rulesetRids = (picoDetails.data?.rulesets || [])
    .map((ruleset) => ruleset.rid)
    .join("\n");

  React.useEffect(() => {
    if (!focusRid || !isTabActive) return;
    if (!rulesetRids.split("\n").includes(focusRid)) return;
    setExpandedRulesets((prev) =>
      prev[focusRid] ? prev : { ...prev, [focusRid]: true }
    );
    const timer = window.setTimeout(() => {
      document.getElementById(`id-rid-${focusRid}`)?.scrollIntoView({
        block: "start",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusRid, isTabActive, rulesetRids]);

  function refreshRulesets() {
    void picoDetails.load();
    void krlSources.load();
  }

  async function openViewPicker(rid: string) {
    setViewPicker({ rid, rulesetSchema: null, loading: true, error: null });
    try {
      const rs = (await apiPost(
        `/c/${pico.eci}/query/io.picolabs.wrangler/rulesetSchema`,
        { rid },
        false
      )) as RulesetSchema | null;
      const viewCount = (rs?.queries || []).filter((q) => q.view).length;
      if (!rs || viewCount === 0) {
        setViewPicker({
          rid,
          rulesetSchema: rs,
          loading: false,
          error:
            "This ruleset has no @view functions in its compiled schema. Add @view to shared functions, then flush or reinstall.",
        });
        return;
      }
      setViewPicker({ rid, rulesetSchema: rs, loading: false, error: null });
    } catch (err) {
      setViewPicker({
        rid,
        rulesetSchema: null,
        loading: false,
        error: String(err),
      });
    }
  }

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

  const appChannels =
    (picoDetails.data &&
      picoDetails.data.channels.filter((channel) => {
        return channel.familyChannelPicoID === null;
      })) ||
    [];

  return (
    <div>
      <TabPageHeader
        title="Rulesets"
        waiting={picoDetails.waiting || krlSources.waiting}
        onRefresh={refreshRulesets}
      />
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
                  <button
                    type="button"
                    className="btn btn-link btn-sm py-0 align-baseline ml-2"
                    onClick={(e) => {
                      e.preventDefault();
                      setDocsRid(ruleset.rid);
                    }}
                  >
                    Docs
                  </button>
                  {(ruleset.viewCount ?? 0) > 0 ? (
                    <button
                      type="button"
                      className="btn btn-link btn-sm py-0 align-baseline ml-1"
                      onClick={(e) => {
                        e.preventDefault();
                        void openViewPicker(ruleset.rid);
                      }}
                      disabled={picoDetails.waiting}
                    >
                      View
                    </button>
                  ) : null}
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
          <div className="input-group">
            <input
              id="new-rs-url"
              className="form-control"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={picoDetails.waiting || install.waiting}
              placeholder="https://… or file://… or Browse for a local .krl file"
            />
            <div className="input-group-append">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={picoDetails.waiting || install.waiting}
                onClick={() => krlFileInputRef.current?.click()}
              >
                Browse…
              </button>
            </div>
          </div>
          <input
            ref={krlFileInputRef}
            type="file"
            accept=".krl"
            className="d-none"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              void onKrlFileSelected(e.target.files?.[0]);
            }}
          />
          <small className="form-text text-muted">
            Browse reads the file in your browser and stages it on the engine
            host as a temporary file:// URL (for local development).
          </small>
          <ErrorStatus error={browseError} />
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
      {docsRid && isTabActive ? (
        <RulesetDocsModal
          eci={pico.eci}
          rid={docsRid}
          onClose={() => setDocsRid(null)}
        />
      ) : null}
      {viewPicker ? (
        <div
          className="modal show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
          onClick={() => setViewPicker(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-mono">
                  Open view — {viewPicker.rid}
                </h5>
                <button
                  type="button"
                  className="close"
                  aria-label="Close"
                  onClick={() => setViewPicker(null)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  XMLUI apps load at{" "}
                  <code>
                    /ui/&lt;eci&gt;/{viewPicker.rid}/
                  </code>
                  . Choose a channel whose query policy allows the view queries
                  you need.{" "}
                  <a
                    href="/docs/pico-views-xmlui.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pico views (XMLUI)
                  </a>
                </p>
                {viewPicker.loading ? (
                  <p className="small text-muted mb-0">Loading schema…</p>
                ) : viewPicker.error ? (
                  <p className="text-danger small mb-0">{viewPicker.error}</p>
                ) : (
                  <>
                    <div className="form-group mb-2">
                      <label className="small mb-1 d-block">Channel (ECI)</label>
                      <select
                        className="form-control form-control-sm text-mono"
                        value={viewChannelEci}
                        onChange={(e) => setViewChannelEci(e.target.value)}
                      >
                        {appChannels.map((channel) => {
                          const label =
                            channel.id +
                            " " +
                            channel.tags.map((tag) => `#${tag}`).join(" ");
                          return (
                            <option key={channel.id} value={channel.id}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="small text-muted mb-2">
                      <strong>@view</strong> pages:{" "}
                      {(viewPicker.rulesetSchema?.queries || [])
                        .filter((q) => q.view)
                        .map((q) => q.name)
                        .join(", ")}
                    </div>
                    <a
                      className="btn btn-primary btn-sm"
                      href={`/ui/${viewChannelEci}/${encodeURIComponent(viewPicker.rid)}/`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in new tab
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Rulesets;
