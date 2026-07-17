import * as React from "react";
import {
  startRegistration,
} from "@simplewebauthn/browser";
import {
  authDelete,
  authPost,
  createInvite,
  CredentialInfo,
  fetchSession,
  inviteRegisterUrl,
  UiSession,
} from "../authApi";
import {
  fetchOAuthApps,
  OAuthAppCredentials,
  OAuthAppSummary,
  registerOAuthApp,
  revokeOAuthApp,
} from "../oauthApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  allowSelfSignup?: boolean;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function shortId(id: string) {
  if (id.length <= 16) return id;
  return id.slice(0, 8) + "…" + id.slice(-6);
}

interface SettingsSectionProps {
  id: string;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SettingsSection({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: SettingsSectionProps) {
  return (
    <div className="settings-section border rounded mb-3">
      <button
        type="button"
        id={`${id}-toggle`}
        className="settings-section-toggle btn btn-link btn-block text-left d-flex align-items-center justify-content-between"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
      >
        <span className="h6 mb-0 text-dark">{title}</span>
        <span className="settings-section-chevron text-muted" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {!open && summary ? (
        <div className="settings-section-summary px-3 pb-2 text-muted small">
          {summary}
        </div>
      ) : (
        ""
      )}
      {open ? (
        <div id={`${id}-panel`} className="settings-section-body px-3 pb-3">
          {children}
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

const SettingsModal: React.FC<Props> = ({
  open,
  onClose,
  onLogout,
  allowSelfSignup = false,
}) => {
  const [session, setSession] = React.useState<UiSession | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newLabel, setNewLabel] = React.useState("");
  const [inviteLabel, setInviteLabel] = React.useState("");
  const [inviteBootstrapUrl, setInviteBootstrapUrl] = React.useState("");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [oauthApps, setOAuthApps] = React.useState<OAuthAppSummary[] | null>(null);
  const [oauthAppsLoading, setOAuthAppsLoading] = React.useState(false);
  const [oauthAppsError, setOAuthAppsError] = React.useState<string | null>(null);
  const [oauthAppName, setOAuthAppName] = React.useState("");
  const [oauthRedirectUris, setOAuthRedirectUris] = React.useState("");
  const [oauthPublicClient, setOAuthPublicClient] = React.useState(true);
  const [oauthAppBusy, setOAuthAppBusy] = React.useState(false);
  const [oauthAppIssued, setOAuthAppIssued] = React.useState<OAuthAppCredentials | null>(null);
  const [sectionsOpen, setSectionsOpen] = React.useState({
    passkeys: true,
    invite: false,
    oauth: false,
  });

  function toggleSection(section: keyof typeof sectionsOpen) {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  const loadOAuthApps = React.useCallback(async () => {
    setOAuthAppsLoading(true);
    setOAuthAppsError(null);
    try {
      setOAuthApps(await fetchOAuthApps());
    } catch (err) {
      setOAuthApps(null);
      setOAuthAppsError(err + "");
    } finally {
      setOAuthAppsLoading(false);
    }
  }, []);

  const loadSession = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const who = await fetchSession();
      if (!who.authenticated) {
        throw new Error("Not signed in");
      }
      setSession(who);
    } catch (err) {
      setError(err + "");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setNewLabel("");
      setInviteLabel("");
      setInviteLink(null);
      setOAuthAppName("");
      setOAuthRedirectUris("");
      setOAuthPublicClient(true);
      setOAuthAppIssued(null);
      setSectionsOpen({ passkeys: true, invite: false, oauth: false });
      loadSession();
      loadOAuthApps();
    }
  }, [open, loadSession, loadOAuthApps]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleCreateInvite() {
    setInviteBusy(true);
    setError(null);
    try {
      const invite = await createInvite(
        inviteLabel.trim() || undefined,
        inviteBootstrapUrl.trim() || undefined
      );
      setInviteLink(inviteRegisterUrl(invite.token));
      setInviteLabel("");
      setInviteBootstrapUrl("");
    } catch (err) {
      setError(err + "");
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (err) {
      setError(err + "");
    }
  }

  async function handleRegisterOAuthApp() {
    setOAuthAppBusy(true);
    setError(null);
    setOAuthAppIssued(null);
    try {
      const redirect_uris = oauthRedirectUris
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const issued = await registerOAuthApp({
        name: oauthAppName.trim(),
        redirect_uris,
        public_client: oauthPublicClient,
      });
      setOAuthAppIssued(issued);
      setOAuthAppName("");
      setOAuthRedirectUris("");
      setSectionsOpen((prev) => ({ ...prev, oauth: true }));
      await loadOAuthApps();
    } catch (err) {
      setError(err + "");
    } finally {
      setOAuthAppBusy(false);
    }
  }

  async function handleRevokeOAuthApp(app: OAuthAppSummary) {
    if (!window.confirm(`Remove OAuth app “${app.name}”?`)) {
      return;
    }
    setOAuthAppBusy(true);
    setError(null);
    try {
      await revokeOAuthApp(app.client_id);
      await loadOAuthApps();
    } catch (err) {
      setError(err + "");
    } finally {
      setOAuthAppBusy(false);
    }
  }

  async function handleAddPasskey() {
    setBusy(true);
    setError(null);
    try {
      const options = await authPost("/auth/credentials/options", {});
      const attResp = await startRegistration({ optionsJSON: options });
      await authPost("/auth/credentials/verify", {
        ...attResp,
        label: newLabel.trim() || "passkey",
      });
      setNewLabel("");
      await loadSession();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePasskey(credential: CredentialInfo) {
    const credentials = session?.credentials || [];
    if (credentials.length <= 1) {
      setError("You must keep at least one passkey on your account.");
      return;
    }
    if (
      !window.confirm(
        `Remove passkey “${credential.label || shortId(credential.credentialID)}”?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authDelete(
        `/auth/credentials/${encodeURIComponent(credential.credentialID)}`
      );
      await loadSession();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return null;
  }

  const credentials = session?.credentials || [];
  const passkeysSummary =
    credentials.length === 0
      ? "No passkeys"
      : credentials.length === 1
        ? "1 passkey"
        : `${credentials.length} passkeys`;
  const oauthSummary = oauthAppsLoading
    ? "Loading…"
    : oauthAppsError
      ? "Unavailable"
      : oauthApps && oauthApps.length > 0
        ? oauthApps.length === 1
          ? "1 app"
          : `${oauthApps.length} apps`
        : "No apps registered";

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal card shadow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 id="settings-modal-title" className="h5 mb-0">
            Settings
          </h2>
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={onClose}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="card-body">
          {loading ? <p className="text-muted mb-0">Loading…</p> : ""}

          {!loading && session ? (
            <>
              <div className="mb-4">
                <div className="text-muted small">Signed into</div>
                <div className="font-weight-bold">
                  {session.displayName || "Account"}
                </div>
              </div>

              <SettingsSection
                id="settings-passkeys"
                title="Passkeys"
                summary={passkeysSummary}
                open={sectionsOpen.passkeys}
                onToggle={() => toggleSection("passkeys")}
              >
                {credentials.length === 0 ? (
                  <p className="text-muted small mb-3">No passkeys found.</p>
                ) : (
                  <ul className="list-group mb-3">
                    {credentials.map((cred) => (
                      <li
                        key={cred.credentialID}
                        className="list-group-item d-flex align-items-start justify-content-between"
                      >
                        <div className="mr-3">
                          <div className="font-weight-bold">
                            {cred.label || "passkey"}
                          </div>
                          <div className="text-muted small text-mono">
                            {shortId(cred.credentialID)}
                          </div>
                          <div className="text-muted small">
                            Added {formatDate(cred.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={busy || credentials.length <= 1}
                          title={
                            credentials.length <= 1
                              ? "Cannot remove your only passkey"
                              : "Remove passkey"
                          }
                          onClick={() => handleDeletePasskey(cred)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <h4 className="h6">Add passkey</h4>
                <div className="form-group mb-2">
                  <label htmlFor="passkeyLabel" className="small mb-1">
                    Label (optional)
                  </label>
                  <input
                    id="passkeyLabel"
                    className="form-control form-control-sm"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. MacBook, YubiKey"
                    disabled={busy}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={busy}
                  onClick={handleAddPasskey}
                >
                  {busy ? "Waiting for passkey…" : "Add passkey"}
                </button>
              </SettingsSection>

              {!allowSelfSignup ? (
                <SettingsSection
                  id="settings-invite"
                  title="Invite someone"
                  summary="Create a single-use registration link"
                  open={sectionsOpen.invite}
                  onToggle={() => toggleSection("invite")}
                >
                  <p className="text-muted small mb-2">
                    Create a single-use link so someone can register when
                    self-signup is disabled.
                  </p>
                  <div className="form-group mb-2">
                    <label htmlFor="inviteLabel" className="small mb-1">
                      Label (optional)
                    </label>
                    <input
                      id="inviteLabel"
                      className="form-control form-control-sm"
                      value={inviteLabel}
                      onChange={(e) => setInviteLabel(e.target.value)}
                      placeholder="e.g. Alex"
                      disabled={inviteBusy || busy}
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="inviteBootstrapUrl" className="small mb-1">
                      Bootstrap ruleset URL (optional)
                    </label>
                    <input
                      id="inviteBootstrapUrl"
                      className="form-control form-control-sm text-mono"
                      value={inviteBootstrapUrl}
                      onChange={(e) => setInviteBootstrapUrl(e.target.value)}
                      placeholder="file://… or https://…/bootstrap.krl"
                      disabled={inviteBusy || busy}
                    />
                    <small className="form-text text-muted">
                      Installed on the new root when the invite is accepted. Validated
                      when you create the invite.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={inviteBusy || busy}
                    onClick={handleCreateInvite}
                  >
                    {inviteBusy ? "Creating…" : "Create invite link"}
                  </button>
                  {inviteLink ? (
                    <div className="mt-3">
                      <label htmlFor="inviteLink" className="small mb-1">
                        Invite link
                      </label>
                      <div className="input-group input-group-sm">
                        <input
                          id="inviteLink"
                          className="form-control text-mono"
                          value={inviteLink}
                          readOnly
                        />
                        <div className="input-group-append">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleCopyInviteLink}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                </SettingsSection>
              ) : (
                ""
              )}

              <SettingsSection
                id="settings-oauth"
                title="OAuth apps"
                summary={oauthSummary}
                open={sectionsOpen.oauth}
                onToggle={() => toggleSection("oauth")}
              >
                <p className="text-muted small mb-2">
                  Register apps like Home Assistant for authorization-code access
                  across this mesh. Install <code>io.picolabs.oauth</code> on the
                  root pico first.
                </p>
                {oauthAppsLoading ? (
                  <p className="text-muted small mb-0">Loading apps…</p>
                ) : oauthAppsError ? (
                  <p className="text-muted small mb-0">{oauthAppsError}</p>
                ) : oauthApps && oauthApps.length > 0 ? (
                  <ul className="list-group mb-3">
                    {oauthApps.map((app) => (
                      <li
                        key={app.client_id}
                        className="list-group-item d-flex align-items-start justify-content-between"
                      >
                        <div className="mr-3 flex-grow-1">
                          <div className="font-weight-bold">{app.name}</div>
                          <label className="small mb-0 text-muted">Client ID</label>
                          <input
                            className="form-control form-control-sm text-mono mb-1"
                            value={app.client_id}
                            readOnly
                            onFocus={(e) => e.target.select()}
                          />
                          <div className="text-muted small">
                            {app.public_client ? "Public (PKCE)" : "Confidential"}
                          </div>
                          <div className="text-muted small">
                            {app.redirect_uris.join(", ")}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={oauthAppBusy || busy}
                          onClick={() => handleRevokeOAuthApp(app)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : oauthApps ? (
                  <p className="text-muted small">No OAuth apps registered.</p>
                ) : (
                  ""
                )}

                <div className="form-group mb-2">
                  <label htmlFor="oauthAppName" className="small mb-1">
                    App name
                  </label>
                  <input
                    id="oauthAppName"
                    className="form-control form-control-sm"
                    value={oauthAppName}
                    onChange={(e) => setOAuthAppName(e.target.value)}
                    placeholder="Home Assistant"
                    disabled={oauthAppBusy || busy}
                  />
                </div>
                <div className="form-group mb-2">
                  <label htmlFor="oauthRedirectUris" className="small mb-1">
                    Redirect URIs (one per line)
                  </label>
                  <textarea
                    id="oauthRedirectUris"
                    className="form-control form-control-sm text-mono"
                    rows={3}
                    value={oauthRedirectUris}
                    onChange={(e) => setOAuthRedirectUris(e.target.value)}
                    placeholder="https://homeassistant.local:8123/auth/external/callback"
                    disabled={oauthAppBusy || busy}
                  />
                </div>
                <div className="form-check mb-2">
                  <input
                    id="oauthPublicClient"
                    className="form-check-input"
                    type="checkbox"
                    checked={oauthPublicClient}
                    onChange={(e) => setOAuthPublicClient(e.target.checked)}
                    disabled={oauthAppBusy || busy}
                  />
                  <label className="form-check-label small" htmlFor="oauthPublicClient">
                    Public client (PKCE; typical for Home Assistant)
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={oauthAppBusy || busy}
                  onClick={handleRegisterOAuthApp}
                >
                  {oauthAppBusy ? "Registering…" : "Register app"}
                </button>
                {oauthAppIssued ? (
                  <div className="mt-3">
                    <div className="alert alert-success py-2 small mb-2">
                      App registered. Copy the client ID
                      {oauthAppIssued.client_secret
                        ? " and client secret (shown once)"
                        : ""}{" "}
                      into your integrator.
                    </div>
                    <label className="small mb-1">Client ID</label>
                    <input
                      className="form-control form-control-sm text-mono mb-2"
                      value={oauthAppIssued.client_id}
                      readOnly
                      onFocus={(e) => e.target.select()}
                    />
                    {oauthAppIssued.client_secret ? (
                      <>
                        <label className="small mb-1">Client secret</label>
                        <input
                          className="form-control form-control-sm text-mono"
                          value={oauthAppIssued.client_secret}
                          readOnly
                        />
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                ) : (
                  ""
                )}
              </SettingsSection>
            </>
          ) : (
            ""
          )}

          {error ? <div className="alert alert-danger py-2">{error}</div> : ""}
        </div>

        <div className="card-footer d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            disabled={busy}
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
