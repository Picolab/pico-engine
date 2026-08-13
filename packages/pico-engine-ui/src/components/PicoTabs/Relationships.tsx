import * as React from "react";
import { apiGet, apiPost } from "../../api";
import picoPageStore from "../../stores/picoPageStore";
import { Channel } from "../../types/Channel";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncLoader from "../../useAsyncLoader";
import {
  formatEventPolicy,
  formatQueryPolicy,
  parseEventPolicy,
  ParseNViewEventPolicy,
  ParseNViewQueryPolicy,
  parseQueryPolicy,
  ViewEventPolicy,
  ViewQueryPolicy,
} from "../widgets/ChannelPolicies";
import ErrorStatus from "../widgets/ErrorStatus";

function getRefVal(ref: React.MutableRefObject<HTMLInputElement | null>) {
  return ref.current && ref.current.value;
}

interface Props {
  pico: PicoBox;
}

export interface SubBus {
  Id: string;
  layer2?: boolean;
  Tx?: string;
  Rx?: string;
  Tx_did?: string;
  Rx_did?: string;
  Tx_host?: string;
  Tx_role?: string;
  Rx_role?: string;
  channel_name?: string;
  channel_type?: string;
  name?: string;
  target_did?: string;
}

function isLayer2Sub(sub: SubBus): boolean {
  return sub.layer2 === true;
}

function subDisplayName(sub: SubBus): string | undefined {
  const name = sub.name || sub.channel_name;
  if (typeof name !== "string") {
    return undefined;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function DidRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value?: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  if (!value) {
    return null;
  }

  async function copyValue() {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div className="mb-1 d-flex align-items-start">
      <div className="flex-grow-1">
        <b className="text-muted">{label}:</b>{" "}
        <span className="text-mono small">{value}</span>
      </div>
      {copyable ? (
        <button
          type="button"
          className="btn btn-sm btn-link p-0 ml-2 off-engine-copy-btn"
          title={copied ? "Copied" : "Copy to clipboard"}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          onClick={() => {
            void copyValue();
          }}
        >
          {copied ? (
            <span className="text-success small">Copied</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );
}

function RxPolicyPanel({
  pico,
  rxEci,
  channel,
  onChannelUpdated,
}: {
  pico: PicoBox;
  rxEci: string;
  channel?: Channel;
  onChannelUpdated: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [eventPolicy, setEventPolicy] = React.useState("");
  const [queryPolicy, setQueryPolicy] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (channel) {
      setEventPolicy(formatEventPolicy(channel.eventPolicy));
      setQueryPolicy(formatQueryPolicy(channel.queryPolicy));
    }
  }, [channel]);

  async function savePolicies(e: React.FormEvent) {
    e.preventDefault();
    if (!channel) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPost(
        `/c/${pico.eci}/event/engine_ui/update_channel/query/io.picolabs.pico-engine-ui/pico`,
        {
          eci: channel.id,
          tags: channel.tags,
          eventPolicy: parseEventPolicy(eventPolicy),
          queryPolicy: parseQueryPolicy(queryPolicy),
        }
      );
      onChannelUpdated();
      setEditing(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 p-2 border rounded bg-light">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <b className="small">Relationship Rx channel policy</b>
        {channel && !editing ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setEditing(true)}
          >
            Edit policies
          </button>
        ) : null}
        {editing ? (
          <button
            type="button"
            className="btn btn-sm btn-link p-0"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
      <div className="small text-muted text-mono mb-1">Rx ECI: {rxEci}</div>
      {channel && editing ? (
        <form onSubmit={savePolicies}>
          <div className="form-group mb-2">
            <label className="small font-weight-bold">Event policy</label>
            <div className="row">
              <div className="col">
                <textarea
                  rows={3}
                  className="form-control form-control-sm"
                  value={eventPolicy}
                  onChange={(e) => setEventPolicy(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="col">
                <ParseNViewEventPolicy src={eventPolicy} />
              </div>
            </div>
          </div>
          <div className="form-group mb-2">
            <label className="small font-weight-bold">Query policy</label>
            <div className="row">
              <div className="col">
                <textarea
                  rows={3}
                  className="form-control form-control-sm"
                  value={queryPolicy}
                  onChange={(e) => setQueryPolicy(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="col">
                <ParseNViewQueryPolicy src={queryPolicy} />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-sm btn-outline-primary"
            disabled={saving}
          >
            Save policies
          </button>
        </form>
      ) : channel ? (
        <div className="row">
          <div className="col">
            <div className="small font-weight-bold">Events</div>
            <ViewEventPolicy policy={channel.eventPolicy} />
          </div>
          <div className="col">
            <div className="small font-weight-bold">Queries</div>
            <ViewQueryPolicy policy={channel.queryPolicy} />
          </div>
        </div>
      ) : (
        <div className="text-muted small">
          Channel details not loaded — reload the tab or expand this relationship
          again.
        </div>
      )}
      {error ? <div className="text-danger small mt-1">{error}</div> : null}
    </div>
  );
}

function SubDetail({
  pico,
  sub,
  rxChannel,
  onDelete,
  onRefresh,
  onChannelUpdated,
  showSend,
  deleteLabel = "Cancel relationship",
}: {
  pico: PicoBox;
  sub: SubBus;
  rxChannel?: Channel;
  onDelete?: () => void;
  onRefresh: () => void;
  onChannelUpdated: () => void;
  showSend?: boolean;
  deleteLabel?: string;
}) {
  const didBased = isLayer2Sub(sub);
  const sendDomain = React.useRef<HTMLInputElement | null>(null);
  const sendType = React.useRef<HTMLInputElement | null>(null);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [sendOk, setSendOk] = React.useState(false);

  async function sendTestEvent(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSendOk(false);
    const domain = getRefVal(sendDomain) || "wrangler";
    const type = getRefVal(sendType) || "ping";
    try {
      await apiPost(`/c/${pico.eci}/event/wrangler/send_event_on_subs`, {
        subID: sub.Id,
        domain,
        type,
        attrs: { uiTest: true },
      });
      setSendOk(true);
    } catch (err) {
      setSendError(String(err));
    }
  }

  return (
    <div className="ml-3 mb-3">
      {didBased ? (
        <span className="badge badge-primary mb-2">DID</span>
      ) : (
        <span className="badge badge-secondary mb-2">ECI</span>
      )}

      <DidRow label="Remote Tx DID" value={sub.Tx_did} />
      <DidRow label="Local Rx DID" value={sub.Rx_did} />
      {!didBased && sub.Tx ? (
        <DidRow label="Remote Tx ECI" value={sub.Tx} />
      ) : null}
      {sub.Tx_host ? <DidRow label="Tx host" value={sub.Tx_host} /> : null}
      {sub.Tx_role ? <DidRow label="Tx role" value={sub.Tx_role} /> : null}
      {sub.Rx_role ? <DidRow label="Rx role" value={sub.Rx_role} /> : null}
      {subDisplayName(sub) ? (
        <DidRow label="Name" value={subDisplayName(sub)!} />
      ) : null}

      {sub.Rx ? (
        <RxPolicyPanel
          pico={pico}
          rxEci={sub.Rx}
          channel={rxChannel}
          onChannelUpdated={onChannelUpdated}
        />
      ) : null}

      {showSend && didBased ? (
        <form className="form-inline mt-2" onSubmit={sendTestEvent}>
          <input
            type="text"
            className="form-control form-control-sm mr-1"
            ref={sendDomain}
            placeholder="domain"
            defaultValue="wrangler"
          />
          <input
            type="text"
            className="form-control form-control-sm mr-1"
            ref={sendType}
            placeholder="type"
            defaultValue="ping"
          />
          <button type="submit" className="btn btn-sm btn-outline-primary">
            Send test event
          </button>
        </form>
      ) : null}
      {sendOk ? (
        <div className="text-success small mt-1">Event sent.</div>
      ) : null}
      {sendError ? (
        <div className="text-danger small mt-1">{sendError}</div>
      ) : null}

      <details className="mt-2">
        <summary className="small text-muted">Raw relationship record</summary>
        <pre className="small mb-0">{JSON.stringify(sub, null, 2)}</pre>
      </details>

      {onDelete ? (
        <button
          className="btn btn-outline-danger btn-sm mt-2"
          type="button"
          onClick={onDelete}
        >
          {deleteLabel}
        </button>
      ) : null}
    </div>
  );
}

function IdentityPanel({
  pico,
  myDid,
  publicIntro,
  wellKnownRx,
  onPublicIntroChange,
}: {
  pico: PicoBox;
  myDid: string | null;
  publicIntro: boolean | null;
  wellKnownRx: string;
  onPublicIntroChange: (enabled: boolean) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function togglePublicIntro(enabled: boolean) {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/c/${pico.eci}/event/wrangler/set_public_intro`, {
        enabled,
      });
      onPublicIntroChange(enabled);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 p-3 border rounded">
      <h5 className="h6 mb-3">Identity</h5>
      <DidRow label="did:webvh (myDid)" value={myDid || undefined} copyable />
      {wellKnownRx ? (
        <DidRow label="wellKnown_Rx (ECI-based)" value={wellKnownRx} />
      ) : null}
      <div className="form-check mt-2">
        <input
          className="form-check-input"
          type="checkbox"
          id={`public-intro-${pico.eci}`}
          checked={publicIntro === true}
          disabled={busy || publicIntro === null}
          onChange={(e) => togglePublicIntro(e.target.checked)}
        />
        <label className="form-check-label" htmlFor={`public-intro-${pico.eci}`}>
          Public intro (accept unsolicited SKY intro on did:webvh)
        </label>
      </div>
      {error ? <div className="text-danger small mt-1">{error}</div> : null}
    </div>
  );
}

const Relationships: React.FC<Props> = ({ pico }) => {
  const [established, setEstablished] = React.useState<SubBus[]>([]);
  const [outbound, setOutbound] = React.useState<SubBus[]>([]);
  const [inbound, setInbound] = React.useState<SubBus[]>([]);
  const [myWellKnown, setMyWellKnown] = React.useState<string>("");
  const [myDid, setMyDid] = React.useState<string | null>(null);
  const [publicIntro, setPublicIntro] = React.useState<boolean | null>(null);
  const [expandedSubs, setExpandedSubs] = React.useState<{
    [id: string]: boolean;
  }>({});
  const [createMode, setCreateMode] = React.useState<"did" | "legacy">("did");
  const [createError, setCreateError] = React.useState<string | null>(null);

  const targetDid = React.useRef<HTMLInputElement | null>(null);
  const l2Name = React.useRef<HTMLInputElement | null>(null);
  const l2RxRole = React.useRef<HTMLInputElement | null>(null);
  const l2TxRole = React.useRef<HTMLInputElement | null>(null);
  const l2ChannelType = React.useRef<HTMLInputElement | null>(null);
  const l2Password = React.useRef<HTMLInputElement | null>(null);

  const wellKnown_Tx = React.useRef<HTMLInputElement | null>(null);
  const Rx_role = React.useRef<HTMLInputElement | null>(null);
  const Tx_role = React.useRef<HTMLInputElement | null>(null);
  const name = React.useRef<HTMLInputElement | null>(null);
  const channel_type = React.useRef<HTMLInputElement | null>(null);
  const Tx_host = React.useRef<HTMLInputElement | null>(null);
  const password = React.useRef<HTMLInputElement | null>(null);

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/pico`)
  );

  const channels: Channel[] =
    (picoDetails.data && picoDetails.data.channels) || [];

  function channelForRx(rxEci?: string): Channel | undefined {
    if (!rxEci) {
      return undefined;
    }
    return channels.find((c) => c.id === rxEci);
  }

  function refreshAll() {
    getWellKnown();
    getIdentity();
    getEstablished();
    getInbound();
    getOutbound();
    picoDetails.load();
    picoPageStore.refreshRelationships();
  }

  const getWellKnown = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/wellKnown_Rx`)
      .then((resp) => {
        setMyWellKnown(resp?.id || "");
      })
      .catch(() => setMyWellKnown(""));
  };

  const getIdentity = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.wrangler/myDid`)
      .then((did) => setMyDid(did ? String(did) : null))
      .catch(() => setMyDid(null));
    apiGet(`/c/${pico.eci}/query/io.picolabs.wrangler/publicIntro`)
      .then((v) => setPublicIntro(!!v))
      .catch(() => setPublicIntro(null));
  };

  const getEstablished = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/established`).then(
      (resp) => {
        setEstablished(resp || []);
      }
    );
  };

  const getInbound = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/inbound`).then(
      (resp) => {
        setInbound(resp || []);
      }
    );
  };

  const getOutbound = () => {
    apiGet(`/c/${pico.eci}/query/io.picolabs.subscription/outbound`).then(
      (resp) => {
        setOutbound(resp || []);
      }
    );
  };

  React.useEffect(() => {
    refreshAll();
  }, [pico.eci]);

  const acceptInbound = async (Id: string) => {
    await apiPost(`/c/${pico.eci}/event/wrangler/pending_relationship_approval`, {
      Id,
    });
    refreshAll();
  };

  const cancelOutbound = async (Id: string) => {
    await apiPost(`/c/${pico.eci}/event/wrangler/outbound_relationship_cancellation`, { Id });
    refreshAll();
  };

  const deleteRelationship = async (Id: string) => {
    await apiPost(`/c/${pico.eci}/event/wrangler/relationship_cancellation`, {
      Id,
    });
    refreshAll();
  };

  async function createDidBased(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const did = (getRefVal(targetDid) || "").trim();
    if (!did.startsWith("did:")) {
      setCreateError("target_did must start with did:");
      return;
    }
    try {
      await apiPost(`/c/${pico.eci}/event/wrangler/relationship`, {
        layer2: true,
        target_did: did,
        name: getRefVal(l2Name) || null,
        Rx_role: getRefVal(l2RxRole) || null,
        Tx_role: getRefVal(l2TxRole) || null,
        channel_type: getRefVal(l2ChannelType) || "Tx_Rx",
        password: getRefVal(l2Password) || null,
      });
      getOutbound();
      picoPageStore.refreshRelationships();
    } catch (err) {
      setCreateError(String(err));
    }
  }

  async function createLegacy(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await apiPost(`/c/${pico.eci}/event/wrangler/relationship`, {
        wellKnown_Tx: getRefVal(wellKnown_Tx) || "",
        Rx_role: getRefVal(Rx_role) || null,
        Tx_role: getRefVal(Tx_role) || null,
        name: getRefVal(name) || null,
        channel_type: getRefVal(channel_type) || null,
        Tx_host: getRefVal(Tx_host) || null,
        password: getRefVal(password) || null,
      });
      getOutbound();
    } catch (err) {
      setCreateError(String(err));
    }
  }

  function renderSubList(
    subs: SubBus[],
    opts: {
      keyPrefix: string;
      onDelete?: (id: string) => void;
      onAccept?: (id: string) => void;
      showSend?: boolean;
      deleteLabel?: string;
    }
  ) {
    return subs.map((sub) => {
      const isOpen = !!expandedSubs[sub.Id];
      const displayName = subDisplayName(sub);
      return (
        <div key={`${opts.keyPrefix}-${sub.Id}`}>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${opts.keyPrefix}-sub-${sub.Id}`}
              checked={isOpen}
              onChange={(e) => {
                const map = { ...expandedSubs };
                if (e.target.checked) {
                  map[sub.Id] = true;
                } else {
                  delete map[sub.Id];
                }
                setExpandedSubs(map);
              }}
            />
            <label
              className="form-check-label"
              htmlFor={`${opts.keyPrefix}-sub-${sub.Id}`}
            >
              {displayName ? (
                <>
                  <span className="font-weight-bold">{displayName}</span>
                  <span className="text-muted small ml-2 text-mono">
                    {sub.Id}
                  </span>
                </>
              ) : (
                <span className="text-mono">{sub.Id}</span>
              )}
              {isLayer2Sub(sub) ? (
                <span className="badge badge-primary ml-1">DID</span>
              ) : null}
            </label>
          </div>
          {isOpen ? (
            <>
              <SubDetail
                pico={pico}
                sub={sub}
                rxChannel={channelForRx(sub.Rx)}
                showSend={opts.showSend}
                onRefresh={refreshAll}
                onChannelUpdated={() => {
                  picoDetails.load();
                }}
                deleteLabel={opts.deleteLabel}
                onDelete={
                  opts.onDelete && !opts.onAccept
                    ? () => {
                        void opts.onDelete!(sub.Id);
                      }
                    : undefined
                }
              />
              {opts.onAccept ? (
                <div className="ml-3 mb-3">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    type="button"
                    onClick={() => {
                      void opts.onAccept!(sub.Id);
                    }}
                  >
                    Accept
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      );
    });
  }

  return (
    <div>
      <h3>Relationships</h3>
      <ErrorStatus error={picoDetails.error} />

      <IdentityPanel
        pico={pico}
        myDid={myDid}
        publicIntro={publicIntro}
        wellKnownRx={myWellKnown}
        onPublicIntroChange={setPublicIntro}
      />

      {established.length > 0 ? <h5>Established</h5> : null}
      {renderSubList(established, {
        keyPrefix: "est",
        onDelete: deleteRelationship,
        deleteLabel: "Delete relationship",
        showSend: true,
      })}

      {inbound.length > 0 ? <h5 className="mt-3">Inbound pending</h5> : null}
      {renderSubList(inbound, {
        keyPrefix: "in",
        onAccept: acceptInbound,
      })}

      {outbound.length > 0 ? <h5 className="mt-3">Outbound pending</h5> : null}
      {renderSubList(outbound, {
        keyPrefix: "out",
        onDelete: cancelOutbound,
        deleteLabel: "Cancel outbound",
      })}

      <div className="mt-4">
        <h5>New relationship</h5>
        <ul className="nav nav-pills mb-2">
          <li className="nav-item">
            <button
              type="button"
              className={
                "nav-link" + (createMode === "did" ? " active" : "")
              }
              onClick={() => setCreateMode("did")}
            >
              DID-based
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={
                "nav-link" + (createMode === "legacy" ? " active" : "")
              }
              onClick={() => setCreateMode("legacy")}
            >
              ECI-based
            </button>
          </li>
        </ul>

        {createMode === "did" ? (
          <form onSubmit={createDidBased}>
            <p className="text-muted small">
              Introduce via SKY using the peer&apos;s <code>did:webvh</code>{" "}
              (<b>myDid</b> on their Relationships tab). Share your{" "}
              <b>myDid</b> above when they form a relationship with you.
            </p>
            <div className="form-group">
              <label>target_did</label>
              <input
                type="text"
                className="form-control"
                ref={targetDid}
                placeholder="did:webvh:…"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group col-md-4">
                <label>name</label>
                <input type="text" className="form-control" ref={l2Name} />
              </div>
              <div className="form-group col-md-4">
                <label>Rx_role</label>
                <input type="text" className="form-control" ref={l2RxRole} />
              </div>
              <div className="form-group col-md-4">
                <label>Tx_role</label>
                <input type="text" className="form-control" ref={l2TxRole} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group col-md-6">
                <label>channel_type</label>
                <input
                  type="text"
                  className="form-control"
                  ref={l2ChannelType}
                  defaultValue="Tx_Rx"
                />
              </div>
              <div className="form-group col-md-6">
                <label>password (optional)</label>
                <input type="text" className="form-control" ref={l2Password} />
              </div>
            </div>
            <button type="submit" className="btn btn-outline-primary">
              Request relationship
            </button>
          </form>
        ) : (
          <form onSubmit={createLegacy}>
            <p className="text-muted small">
              Classic introduction via the peer&apos;s wellKnown_Rx ECI.
            </p>
            <div className="form-group">
              <label>wellKnown_Tx</label>
              <input
                type="text"
                className="form-control"
                ref={wellKnown_Tx}
                placeholder="Remote wellKnown_Rx ECI"
              />
            </div>
            <div className="form-row">
              <div className="form-group col-md-4">
                <label>Rx_role</label>
                <input type="text" className="form-control" ref={Rx_role} />
              </div>
              <div className="form-group col-md-4">
                <label>Tx_role</label>
                <input type="text" className="form-control" ref={Tx_role} />
              </div>
              <div className="form-group col-md-4">
                <label>name</label>
                <input type="text" className="form-control" ref={name} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group col-md-4">
                <label>channel_type</label>
                <input type="text" className="form-control" ref={channel_type} />
              </div>
              <div className="form-group col-md-4">
                <label>Tx_host</label>
                <input type="text" className="form-control" ref={Tx_host} />
              </div>
              <div className="form-group col-md-4">
                <label>password</label>
                <input type="text" className="form-control" ref={password} />
              </div>
            </div>
            <button type="submit" className="btn btn-outline-secondary">
              Request legacy relationship
            </button>
          </form>
        )}
        {createError ? (
          <div className="text-danger small mt-2">{createError}</div>
        ) : null}
      </div>
    </div>
  );
};

export default Relationships;
