// The ONE registered redirect URI, so this route serves both the sign-in
// redirect leg and the silent-renew iframe leg (thunder-authentication).
// handleCallback() dispatches on the stored request_type and resolves without
// a value for either; navigating to "/" on success is a no-op for the hidden
// iframe (the parent window discards it the moment the promise settles) and is
// what lands the user back in the app for the redirect leg.

import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../authz/session";

export function CallbackPage(): ReactElement {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void handleCallback()
      .then(() => {
        if (live) navigate("/", { replace: true });
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "Sign-in failed.");
      });
    return () => {
      live = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <main>
        <h1>Sign-in failed</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main>
      <p>Completing sign-in…</p>
    </main>
  );
}
