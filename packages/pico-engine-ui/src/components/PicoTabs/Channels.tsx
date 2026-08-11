import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../../api";
import { Channel } from "../../types/Channel";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";
import {
  channelTagsToString,
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
import {
  suggestChannelId,
  validateChannelIdInput,
  CUSTOM_CHANNEL_ID_MIN_LENGTH,
} from "../../channelId";
import {
  createOAuthChannelCredentials,
  exchangeOAuthToken,
  fetchOAuthChannelStatus,
  OAuthChannelStatus,
  OAuthTokenResponse,
  revokeOAuthChannelCredentials,
  revokeOAuthChannelTokens,
} from "../../oauthApi";

interface Props {
  pico: PicoBox;
}

const TOKEN_EXPIRY_OPTIONS = [
  { label: "5 minutes", seconds: 5 * 60 },
  { label: "1 hour", seconds: 60 * 60 },
  { label: "6 hours", seconds: 6 * 60 * 60 },
  { label: "24 hours", seconds: 24 * 60 * 60 },
  { label: "7 days", seconds: 7 * 24 * 60 * 60 },
  { label: "30 days", seconds: 30 * 24 * 60 * 60 },
  { label: "90 days", seconds: 90 * 24 * 60 * 60 },
  { label: "Never", seconds: 0 },
];

const DEFAULT_TOKEN_EXPIRY_SEC = 24 * 60 * 60;
// base64url encoding of 32 random bytes
const CLIENT_SECRET_CHAR_COUNT = 43;
const CLIENT_SECRET_INPUT_WIDTH_CH = CLIENT_SECRET_CHAR_COUNT + 5;
// "oat_" + base64url(32 bytes)
const ACCESS_TOKEN_CHAR_COUNT = 4 + CLIENT_SECRET_CHAR_COUNT;
const ACCESS_TOKEN_INPUT_WIDTH_CH = ACCESS_TOKEN_CHAR_COUNT + 3;

function formatExpiresIn(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "never";
  }
  if (seconds < 60 * 60) {
    return `${Math.round(seconds / 60)}m`;
  }
  if (seconds < 24 * 60 * 60) {
    return `${Math.round(seconds / (60 * 60))}h`;
  }
  return `${Math.round(seconds / (24 * 60 * 60))}d`;
}

function ChannelOAuthPanel({ channelId }: { channelId: string }) {
  const [status, setStatus] = React.useState<OAuthChannelStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [issued, setIssued] = React.useState<{
    client_id: string;
    client_secret: string;
  } | null>(null);
  const [clientSecretInput, setClientSecretInput] = React.useState("");
  const [tokenExpirySec, setTokenExpirySec] = React.useState(DEFAULT_TOKEN_EXPIRY_SEC);
  const [token, setToken] = React.useState<OAuthTokenResponse | null>(null);
  const [tokenBusy, setTokenBusy] = React.useState(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchOAuthChannelStatus(channelId));
    } catch (err) {
      setError(err + "");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (issued?.client_secret) {
      setClientSecretInput(issued.client_secret);
      setToken(null);
    }
  }, [issued]);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const creds = await createOAuthChannelCredentials(channelId);
      setIssued(creds);
      await load();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeSecret() {
    if (!window.confirm("Revoke webhook credentials for this channel?")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await revokeOAuthChannelCredentials(channelId);
      setIssued(null);
      setClientSecretInput("");
      setToken(null);
      await load();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  async function handleGetToken(e: React.FormEvent) {
    e.preventDefault();
    const secret = clientSecretInput.trim();
    if (!secret) {
      return;
    }
    setTokenBusy(true);
    setTokenError(null);
    try {
      setToken(
        await exchangeOAuthToken(
          status?.clientId || channelId,
          secret,
          tokenExpirySec
        )
      );
    } catch (err) {
      setToken(null);
      setTokenError(err + "");
    } finally {
      setTokenBusy(false);
    }
  }

  async function handleCopyToken() {
    if (!token?.access_token) {
      return;
    }
    try {
      await navigator.clipboard.writeText(token.access_token);
    } catch {
      // ignore clipboard failures
    }
  }

  async function handleRevokeTokens() {
    setBusy(true);
    setError(null);
    try {
      await revokeOAuthChannelTokens(channelId);
      setToken(null);
      await load();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="text-muted small mt-2">Loading webhook auth…</div>;
  }
  if (!status?.eligible) {
    return status?.reason ? (
      <div className="text-muted small mt-2">{status.reason}</div>
    ) : null;
  }

  return (
    <div className="border rounded p-2 mt-2 mb-2">
      <div className="font-weight-bold small">Webhook OAuth</div>
      <p className="text-muted small mb-2">
        This channel requires a bearer token on every request. Create credentials,
        then mint an access token below (or call <code>POST /oauth/token</code>).
      </p>
      {!status.hasSecret ? (
        <div className="alert alert-warning py-2 small mb-2">
          No credentials yet — external access is blocked until you create them.
        </div>
      ) : (
        ""
      )}
      <div className="small text-mono mb-1">
        client_id: {status.clientId || channelId}
      </div>
      {status.hasSecret ? (
        <div className="text-muted small mb-2">
          Credentials active
          {status.createdAt ? ` (since ${new Date(status.createdAt).toLocaleString()})` : ""}
        </div>
      ) : (
        <div className="text-muted small mb-2">No credentials yet.</div>
      )}
      {issued ? (
        <div className="alert alert-warning py-2 small">
          <div>
            <strong>client_secret</strong> (copy now — shown once):
          </div>
          <div className="text-mono">{issued.client_secret}</div>
        </div>
      ) : (
        ""
      )}
      <div className="btn-group btn-group-sm">
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={busy}
          onClick={handleCreate}
        >
          {status.hasSecret ? "Rotate credentials" : "Create credentials"}
        </button>
        {status.hasSecret ? (
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={busy}
              onClick={handleRevokeTokens}
            >
              Revoke tokens
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={busy}
              onClick={handleRevokeSecret}
            >
              Revoke credentials
            </button>
          </>
        ) : (
          ""
        )}
      </div>
      {status.hasSecret ? (
        <form className="mt-3" onSubmit={handleGetToken}>
          <div className="font-weight-bold small mb-1">Get access token</div>
          <div className="form-group mb-2">
            <div className="d-flex align-items-end flex-wrap">
              <div className="mr-3">
                <label
                  htmlFor={`oauth-secret-${channelId}`}
                  className="small mb-1"
                >
                  client_secret
                </label>
                <input
                  id={`oauth-secret-${channelId}`}
                  type="password"
                  className="form-control form-control-sm text-mono"
                  style={{
                    width: `${CLIENT_SECRET_INPUT_WIDTH_CH}ch`,
                    maxWidth: "100%",
                  }}
                  value={clientSecretInput}
                  onChange={(e) => {
                    setClientSecretInput(e.target.value);
                    setToken(null);
                  }}
                  placeholder="Paste your client secret"
                  disabled={tokenBusy || busy}
                  autoComplete="off"
                />
              </div>
              <div className="flex-shrink-0">
                <label
                  htmlFor={`oauth-expiry-${channelId}`}
                  className="small mb-1 text-nowrap"
                >
                  Token lifetime
                </label>
                <select
                  id={`oauth-expiry-${channelId}`}
                  className="form-control form-control-sm w-auto"
                  value={tokenExpirySec}
                  onChange={(e) => {
                    setTokenExpirySec(Number(e.target.value));
                    setToken(null);
                  }}
                  disabled={tokenBusy || busy}
                >
                  {TOKEN_EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.seconds} value={opt.seconds}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-sm btn-outline-primary"
            disabled={tokenBusy || busy || !clientSecretInput.trim()}
          >
            {tokenBusy ? "Minting…" : "Get token"}
          </button>
          {token ? (
            <div className="mt-2">
              <label
                htmlFor={`oauth-token-${channelId}`}
                className="small mb-1"
              >
                access_token ({token.token_type}
                {token.expires_in === undefined
                  ? ", never expires"
                  : `, expires in ${formatExpiresIn(token.expires_in)}`}
                )
              </label>
              <div
                className="input-group input-group-sm"
                style={{ width: "fit-content", maxWidth: "100%" }}
              >
                <input
                  id={`oauth-token-${channelId}`}
                  className="form-control text-mono"
                  style={{
                    width: `${ACCESS_TOKEN_INPUT_WIDTH_CH}ch`,
                    flex: "0 0 auto",
                  }}
                  value={token.access_token}
                  readOnly
                />
                <div className="input-group-append">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCopyToken}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            ""
          )}
          {tokenError ? (
            <div className="text-danger small mt-2">{tokenError}</div>
          ) : (
            ""
          )}
        </form>
      ) : (
        ""
      )}
      {error ? <div className="text-danger small mt-2">{error}</div> : ""}
    </div>
  );
}

function ChannelEditPanel({
  channel,
  disabled,
  onSave,
}: {
  channel: Channel;
  disabled: boolean;
  onSave: (data: {
    eci: string;
    tags: string[];
    eventPolicy: ReturnType<typeof parseEventPolicy>;
    queryPolicy: ReturnType<typeof parseQueryPolicy>;
  }) => void;
}) {
  const [tags, setTags] = React.useState(() => channelTagsToString(channel.tags));
  const [eventPolicy, setEventPolicy] = React.useState(() =>
    formatEventPolicy(channel.eventPolicy)
  );
  const [queryPolicy, setQueryPolicy] = React.useState(() =>
    formatQueryPolicy(channel.queryPolicy)
  );

  React.useEffect(() => {
    setTags(channelTagsToString(channel.tags));
    setEventPolicy(formatEventPolicy(channel.eventPolicy));
    setQueryPolicy(formatQueryPolicy(channel.queryPolicy));
  }, [channel]);

  function appendTag(tag: string) {
    const parts = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      return;
    }
    setTags(parts.length === 0 ? tag : `${parts.join(", ")}, ${tag}`);
  }

  function getUpdateData() {
    return {
      eci: channel.id,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      eventPolicy: parseEventPolicy(eventPolicy),
      queryPolicy: parseQueryPolicy(queryPolicy),
    };
  }

  function isReadyToSave(): boolean {
    try {
      getUpdateData();
      return true;
    } catch (_err) {
      return false;
    }
  }

  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const showOAuth =
    channel.tags.includes("oauth-webhook") ||
    tagList.some((t) => t.toLowerCase() === "oauth-webhook");

  return (
    <div className="mb-3">
      <h5 className="h6">Edit channel</h5>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isReadyToSave()) {
            return;
          }
          onSave(getUpdateData());
        }}
      >
        <div className="form-group">
          <label htmlFor={`edit-chann-tags-${channel.id}`}>Tags</label>
          <div className="text-muted small mb-1">
            Add{" "}
            <button
              type="button"
              className="btn btn-link btn-sm p-0 align-baseline text-mono"
              onClick={() => appendTag("oauth-webhook")}
              disabled={disabled}
            >
              oauth-webhook
            </button>{" "}
            for webhook Client Credentials.
          </div>
          <div className="row">
            <div className="col">
              <input
                id={`edit-chann-tags-${channel.id}`}
                type="text"
                className="form-control form-control-sm"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="col">
              {tagList.map((tag, i) => (
                <span key={i} className="badge badge-secondary ml-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor={`edit-chann-event-${channel.id}`}>Event Policy</label>
          <div className="row">
            <div className="col">
              <textarea
                id={`edit-chann-event-${channel.id}`}
                rows={3}
                className="form-control form-control-sm"
                value={eventPolicy}
                onChange={(e) => setEventPolicy(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="col">
              <ParseNViewEventPolicy src={eventPolicy} />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor={`edit-chann-query-${channel.id}`}>Query Policy</label>
          <div className="row">
            <div className="col">
              <textarea
                id={`edit-chann-query-${channel.id}`}
                rows={3}
                className="form-control form-control-sm"
                value={queryPolicy}
                onChange={(e) => setQueryPolicy(e.target.value)}
                disabled={disabled}
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
          disabled={disabled || !isReadyToSave()}
        >
          Save changes
        </button>
      </form>

      {showOAuth ? (
        <div className="mt-3">
          <ChannelOAuthPanel channelId={channel.id} />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

const Channels: React.FC<Props> = ({ pico }) => {
  const [searchParams] = useSearchParams();
  const focusChannel = searchParams.get("focus") || "";

  const [expandedChannels, setExpandedChannels] = React.useState<{
    [eci: string]: boolean;
  }>({});
  const [tags, setTags] = React.useState<string>("");
  const [channelId, setChannelId] = React.useState<string>(() =>
    suggestChannelId()
  );
  const [eventPolicy, setEventPolicy] = React.useState<string>("allow *:*");
  const [queryPolicy, setQueryPolicy] = React.useState<string>("allow */*");

  function getNewChannData(): any {
    const idError = validateChannelIdInput(channelId);
    if (idError) {
      throw new Error(idError);
    }
    return {
      id: channelId.trim(),
      tags: tags.split(","),
      eventPolicy: parseEventPolicy(eventPolicy),
      queryPolicy: parseQueryPolicy(queryPolicy),
    };
  }

  function isReadyToAdd(): boolean {
    try {
      getNewChannData();
    } catch (err) {
      return false;
    }
    return true;
  }

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/pico`)
  );

  const addChannel = useAsyncAction<{ eci: string; data: any }>(
    ({ eci, data }) =>
      apiPost(
        `/c/${eci}/event/engine_ui/new_channel/query/io.picolabs.pico-engine-ui/pico`,
        data
      ).then((d) => {
        picoDetails.setData(d);
        setChannelId(suggestChannelId());
      })
  );

  const delChannel = useAsyncAction<string>((eci) =>
    apiPost(
      `/c/${pico.eci}/event/engine_ui/del_channel/query/io.picolabs.pico-engine-ui/pico`,
      { eci }
    ).then((d) => picoDetails.setData(d))
  );

  const updateChannel = useAsyncAction<{
    eci: string;
    tags: string[];
    eventPolicy: ReturnType<typeof parseEventPolicy>;
    queryPolicy: ReturnType<typeof parseQueryPolicy>;
  }>((data) =>
    apiPost(
      `/c/${pico.eci}/event/engine_ui/update_channel/query/io.picolabs.pico-engine-ui/pico`,
      data
    ).then((d) => picoDetails.setData(d))
  );

  React.useEffect(() => {
    picoDetails.load();
  }, [pico.eci]);

  React.useEffect(() => {
    if (focusChannel) {
      setExpandedChannels({ [focusChannel]: true });
    }
  }, [focusChannel, pico.eci]);

  const waiting: boolean =
    picoDetails.waiting ||
    delChannel.waiting ||
    addChannel.waiting ||
    updateChannel.waiting;

  const channels: Channel[] =
    (picoDetails.data && picoDetails.data.channels) || [];

  const ctrlC = (e: any) => {
    e.preventDefault();
    const range = document.createRange();
    range.selectNodeContents(e.target);
    const sel = window.getSelection();
    if(sel){
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  function appendTag(tag: string) {
    const parts = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      return;
    }
    setTags(parts.length === 0 ? tag : `${parts.join(", ")}, ${tag}`);
  }

  return (
    <div>
      <h3>Channels</h3>
      <ErrorStatus error={picoDetails.error} />
      <ErrorStatus error={delChannel.error} />
      <ErrorStatus error={updateChannel.error} />

      {channels.length === 0 ? (
        <div className="text-muted">- no channels -</div>
      ) : (
        channels.map((channel) => {
          const isOpen = !!expandedChannels[channel.id];
          const canDelete =
            !channel.familyChannelPicoID && !channel.tags.includes("system");
          const canEdit = canDelete;
          return (
            <div key={channel.id}>
              <div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`chann-${channel.id}`}
                    onChange={(e) => {
                      const eci = channel.id;
                      const map = Object.assign({}, expandedChannels);
                      if (e.target.checked) {
                        map[eci] = true;
                      } else {
                        delete map[eci];
                      }
                      setExpandedChannels(map);
                    }}
                    checked={isOpen}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`chann-${channel.id}`}
                  >
                    <span 
                      className="text-mono"
                      onDoubleClick={(event) => ctrlC(event)}
                      onClick={(event) => {event.preventDefault();}}
                    >{channel.id}</span>
                  </label>
                  {channel.tags.map((tag, i) => {
                    return (
                      <span key={i} className="badge badge-secondary ml-1">
                        {tag}
                      </span>
                    );
                  })}
                  {canDelete && (
                    <button
                      className="btn btn-link btn-sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        delChannel.act(channel.id);
                      }}
                      disabled={waiting}
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
              {isOpen ? (
                <div className="ml-3 mb-3">
                  {channel.familyChannelPicoID ? (
                    <div className="text-muted">This is a family channel.</div>
                  ) : canEdit ? (
                    <ChannelEditPanel
                      channel={channel}
                      disabled={waiting}
                      onSave={(data) => updateChannel.act(data)}
                    />
                  ) : (
                    <div className="row">
                      <div className="col">
                        Event Policy
                        <ViewEventPolicy policy={channel.eventPolicy} />
                      </div>
                      <div className="col">
                        Query Policy
                        <ViewQueryPolicy policy={channel.queryPolicy} />
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
      )}
      <hr />
      <h4>New Channel</h4>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isReadyToAdd()) {
            return;
          }
          const data = getNewChannData();
          addChannel.act({ eci: pico.eci, data });
        }}
      >
        <div className="form-group">
          <label htmlFor="new-chann-id">Channel id (ECI)</label>
          <div className="text-muted small mb-1">
            Choose once at creation; cannot be changed later. At least{" "}
            {CUSTOM_CHANNEL_ID_MIN_LENGTH} characters; letters, digits, hyphen,
            and underscore only. Must be unique across this engine.
          </div>
          <input
            id="new-chann-id"
            type="text"
            className="form-control text-mono"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
      {(() => {
        const channelIdError = validateChannelIdInput(channelId);
        return channelIdError ? (
          <div className="text-danger small mt-1">{channelIdError}</div>
        ) : null;
      })()}
        </div>

        <div className="form-group">
          <label htmlFor="new-chann-tags">Tags</label>
          <div className="text-muted small mb-1">
            Add{" "}
            <button
              type="button"
              className="btn btn-link btn-sm p-0 align-baseline text-mono"
              onClick={() => appendTag("oauth-webhook")}
            >
              oauth-webhook
            </button>{" "}
            for webhook Client Credentials.
          </div>
          <div className="row">
            <div className="col">
              <input
                id="new-chann-tags"
                type="text"
                className="form-control"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="col">
              {tags.split(",").map((tag, i) => {
                return (
                  <span key={i} className="badge badge-secondary ml-1">
                    {tag.trim()}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="new-chann-event-policy">Event Policy</label>
          <div className="row">
            <div className="col">
              <textarea
                id="new-chann-event-policy"
                rows={3}
                className="form-control"
                value={eventPolicy}
                onChange={(e) => setEventPolicy(e.target.value)}
              />
            </div>
            <div className="col">
              <ParseNViewEventPolicy src={eventPolicy} />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="new-chann-query-policy">Query Policy</label>
          <div className="row">
            <div className="col">
              <textarea
                id="new-chann-query-policy"
                rows={3}
                className="form-control"
                value={queryPolicy}
                onChange={(e) => setQueryPolicy(e.target.value)}
              />
            </div>
            <div className="col">
              <ParseNViewQueryPolicy src={queryPolicy} />
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-outline-primary"
          disabled={waiting || !isReadyToAdd()}
        >
          Add
        </button>
        <ErrorStatus error={addChannel.error} />
      </form>
    </div>
  );
};

export default Channels;
