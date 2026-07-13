import * as React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { authLogout, clearInviteFromUrl, fetchUiContext, readInviteFromUrl, UiContext } from "./authApi";
import AuthGate from "./components/AuthGate";
import PicosPage from "./components/PicosPage";

function readOAuthReturn(): string | null {
  try {
    const value = new URL(window.location.href).searchParams.get("oauth_return");
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

function clearOAuthReturnFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("oauth_return")) {
      return;
    }
    url.searchParams.delete("oauth_return");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    // ignore
  }
}

const App: React.FC = () => {
  const [context, setContext] = React.useState<UiContext | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const inviteToken = readInviteFromUrl();
  const [clearingInviteSession, setClearingInviteSession] = React.useState(false);

  const loadContext = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContext(await fetchUiContext());
    } catch (err) {
      setError(err + "");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuthenticated = React.useCallback(async () => {
    const returnPath = readOAuthReturn();
    clearInviteFromUrl();
    await loadContext();
    if (returnPath) {
      clearOAuthReturnFromUrl();
      window.location.assign(returnPath);
    }
  }, [loadContext]);

  React.useEffect(() => {
    loadContext();
  }, [loadContext]);

  React.useEffect(() => {
    if (!inviteToken || !context?.session?.authenticated) {
      setClearingInviteSession(false);
      return;
    }
    let cancelled = false;
    setClearingInviteSession(true);
    authLogout()
      .then(() => loadContext())
      .finally(() => {
        if (!cancelled) {
          setClearingInviteSession(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken, context?.session?.authenticated, loadContext]);

  if (loading || clearingInviteSession) {
    return <div className="container py-5">Loading…</div>;
  }
  if (error) {
    return <div className="container py-5 alert alert-danger">{error}</div>;
  }
  if (!context) {
    return <div className="container py-5">Unable to load engine context.</div>;
  }

  const authenticated = context.session?.authenticated === true;
  const showAuthGate = !authenticated || !!inviteToken;

  if (showAuthGate) {
    return (
      <AuthGate context={context} onAuthenticated={handleAuthenticated} />
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/pico/:eci/:tab" element={<PicosPage />} />
        <Route path="/pico/:eci" element={<PicosPage />} />
        <Route path="*" element={<PicosPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
