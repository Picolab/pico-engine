import * as React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import {
  authLogout,
  clearAuthParamsFromUrl,
  fetchInvite,
  fetchUiContext,
  readInviteFromUrl,
  readOAuthReturnFromUrl,
  UiContext,
} from "./authApi";
import AuthGate from "./components/AuthGate";
import PicosPage from "./components/PicosPage";

const App: React.FC = () => {
  const [context, setContext] = React.useState<UiContext | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [urlVersion, setUrlVersion] = React.useState(0);
  const inviteToken = React.useMemo(
    () => readInviteFromUrl(),
    [urlVersion]
  );
  const [clearingInviteSession, setClearingInviteSession] = React.useState(false);

  const bumpUrl = React.useCallback(() => {
    setUrlVersion((v) => v + 1);
  }, []);

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
    const returnPath = readOAuthReturnFromUrl();
    clearAuthParamsFromUrl();
    bumpUrl();
    await loadContext();
    if (returnPath) {
      window.location.assign(returnPath);
    }
  }, [loadContext, bumpUrl]);

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
    fetchInvite(inviteToken)
      .then((peek) => {
        if (cancelled) {
          return;
        }
        if (!peek.valid) {
          clearAuthParamsFromUrl();
          bumpUrl();
          setClearingInviteSession(false);
          return;
        }
        return authLogout().then(() => loadContext());
      })
      .finally(() => {
        if (!cancelled) {
          setClearingInviteSession(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken, context?.session?.authenticated, loadContext, bumpUrl]);

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
  const showAuthGate = !authenticated;

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
