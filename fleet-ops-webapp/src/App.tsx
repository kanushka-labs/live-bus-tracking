// Routing structure prescribed by thunder-authentication's App.example.tsx:
//
//   NoAccess sits ABOVE the shell route and REPLACES it — a caller who
//   unlocks nothing gets no navbar and no empty sidebar.
//
//   Forbidden sits INSIDE the shell, at /forbidden — the rail stays for a
//   caller who holds other scopes.
//
//   /forbidden is wired into authz/client once, from inside the router
//   (ForbiddenWiring below).
//
//   /callback is routed OUTSIDE the AuthzProvider — there is no session to
//   read until the redirect has been processed.
//
//   Every gated route is wrapped in <RequireOperation>, with the operation
//   taken from SCREEN_ROUTES — never typed here.
//
// DEVIATION FROM THE PATTERN, and why: App.example.tsx gates NoAccess on
// `hasScopedReach`, which is false whenever every reachable screen is
// `loads: null` or `public` — exactly this app's SCREEN_ROUTES today, since
// issue #4 (this one) ships the shell with no load-bearing screens (#6 adds
// those). Using `hasScopedReach` here would send every signed-in caller,
// FleetAdmin and Dispatcher alike, to NoAccess and the shell would never
// render — failing this issue's own acceptance ("the shell renders with
// working navigation"). So this file uses the simpler `reachable.length > 0`
// instead: any signed-in caller sees the shell, because nothing is gated yet.
// Once #6 gives a screen a real `loads`, switch this back to `hasScopedReach`
// so a caller with no Fleet Ops role at all correctly lands on NoAccess.

import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, RequireOperation, useAuthz, useScopes } from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { CallbackPage } from "./pages/Callback";
import { PlaceholderPage } from "./pages/Placeholder";
import { SettingsPage } from "./pages/Settings";

export const APP_NAME = "Fleet Ops";

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in: currentUser()
  // already tried a silent renew, and signing in on a merely expired token
  // re-logs the user in on every visit.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  // See the file comment: `reachable.length === 0` stands in for
  // `!hasScopedReach` while every screen is `loads: null`.
  if (reachable.length === 0) return <NoAccess appName={APP_NAME} />;

  const landing = reachable[0].path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = <PlaceholderPage title={screen.label} />;
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route key={screen.key} element={<RequireOperation op={screen.loads} screen={screen.label} />}>
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        {/* App-shell chrome, not a wireframe screen: reachable by any signed-in caller. */}
        <Route path="/settings" element={<SettingsPage />} />
        {/* Forbidden is INSIDE the shell: the rail the caller can use stays. */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
