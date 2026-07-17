import * as React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { authPost, clearAuthParamsFromUrl, fetchInvite, InvitePeek, readInviteFromUrl, UiContext } from "../authApi";

interface Props {
  context: UiContext;
  onAuthenticated: () => void;
}

const AuthGate: React.FC<Props> = ({ context, onAuthenticated }) => {
  const [displayName, setDisplayName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inviteToken = readInviteFromUrl();
  const [invite, setInvite] = React.useState<InvitePeek | null>(null);
  const [inviteLoading, setInviteLoading] = React.useState(!!inviteToken);
  const inviteRegister = !!inviteToken && invite?.valid === true;
  const [mode, setMode] = React.useState<"register" | "login">(
    inviteToken || !context.hasRoots ? "register" : "login"
  );

  React.useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      return;
    }
    let cancelled = false;
    setInviteLoading(true);
    fetchInvite(inviteToken)
      .then((peek) => {
        if (!cancelled) {
          setInvite(peek);
          if (peek.valid && context.hasRoots && !context.needsAuthMigration) {
            setMode("register");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInvite({ valid: false });
          setError(err + "");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInviteLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken, context.hasRoots, context.needsAuthMigration]);

  React.useEffect(() => {
    if (!invite?.valid || !invite.label) {
      return;
    }
    setDisplayName((current) => current.trim() || invite.label!);
  }, [invite?.valid, invite?.label]);

  const claimOnly = context.needsAuthMigration === true;
  const registerOnly = !context.hasRoots;
  const showInviteRegister = inviteRegister && !claimOnly && mode === "register";

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const options = await authPost("/auth/register/options", {
        displayName: displayName.trim() || undefined,
        invite: inviteToken || undefined,
      });
      const attResp = await startRegistration({ optionsJSON: options });
      await authPost("/auth/register/verify", attResp);
      clearAuthParamsFromUrl();
      onAuthenticated();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const options = await authPost("/auth/claim/options", {
        displayName: displayName.trim() || undefined,
      });
      const attResp = await startRegistration({ optionsJSON: options });
      await authPost("/auth/claim/verify", attResp);
      clearAuthParamsFromUrl();
      onAuthenticated();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    setBusy(true);
    setError(null);
    try {
      const options = await authPost("/auth/login/options", {});
      const attResp = await startAuthentication({ optionsJSON: options });
      await authPost("/auth/login/verify", attResp);
      clearAuthParamsFromUrl();
      onAuthenticated();
    } catch (err) {
      setError(err + "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-gate container py-5" style={{ maxWidth: "420px" }}>
      <div className="text-center mb-4">
        <img
          src="/pico-labs-logo.png"
          alt="Pico Labs"
          className="auth-gate-logo"
        />
      </div>

      {inviteLoading ? (
        <p className="text-muted">Checking invite…</p>
      ) : inviteToken && invite && !invite.valid ? (
        <div className="alert alert-warning">
          This invite link is invalid or has expired.
        </div>
      ) : (
        ""
      )}

      {claimOnly ? (
        <>
          <p className="text-muted">
            This engine already has a pico mesh. Link your passkey to claim it
            and sign in.
          </p>
          <form onSubmit={handleClaim}>
            <div className="form-group">
              <label htmlFor="displayName">Mesh name</label>
              <input
                id="displayName"
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={invite?.label || "My mesh"}
                autoComplete="nickname"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block mt-3"
              disabled={busy}
            >
              {busy ? "Waiting for passkey…" : "Claim with passkey"}
            </button>
          </form>
        </>
      ) : registerOnly || showInviteRegister ? (
        <>
          <p className="text-muted">
            {showInviteRegister
              ? invite?.label
                ? `You've been invited to join (${invite.label}). Create your account with a passkey.`
                : "You've been invited to join. Create your account with a passkey."
              : "Create your account with a passkey. This will create your root pico."}
          </p>
          {showInviteRegister && invite?.bootstrapRid ? (
            <p className="text-muted small">
              This invite will install <code>{invite.bootstrapRid}</code> on your new
              root pico.
            </p>
          ) : (
            ""
          )}
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="displayName">Mesh name</label>
              <input
                id="displayName"
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={invite?.label || "My mesh"}
                autoComplete="nickname"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block mt-3"
              disabled={busy || inviteLoading}
            >
              {busy ? "Waiting for passkey…" : "Register with passkey"}
            </button>
          </form>
        </>
      ) : mode === "login" ? (
        <>
          <p className="text-muted">Sign in with your passkey.</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={busy}
            onClick={handleLogin}
          >
            {busy ? "Waiting for passkey…" : "Sign in with passkey"}
          </button>
          {context.allowSelfSignup ? (
            <button
              type="button"
              className="btn btn-link btn-block mt-2"
              disabled={busy}
              onClick={() => {
                setError(null);
                setMode("register");
              }}
            >
              Create another account
            </button>
          ) : (
            ""
          )}
        </>
      ) : (
        <>
          <p className="text-muted">Register a new account and root pico.</p>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="displayName">Mesh name</label>
              <input
                id="displayName"
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={invite?.label || "My mesh"}
                autoComplete="nickname"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block mt-3"
              disabled={busy}
            >
              {busy ? "Waiting for passkey…" : "Register with passkey"}
            </button>
          </form>
          <button
            type="button"
            className="btn btn-link btn-block mt-2"
            disabled={busy}
            onClick={() => {
              setError(null);
              setMode("login");
            }}
          >
            Back to sign in
          </button>
        </>
      )}

      {error ? <div className="alert alert-danger mt-3">{error}</div> : ""}

      <p className="text-muted small mt-4">version {context.version}</p>
    </div>
  );
};

export default AuthGate;
