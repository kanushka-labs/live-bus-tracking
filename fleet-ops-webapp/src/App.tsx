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
// Issue #6 gives Buses, Devices and Routes their first real `loads`, so this
// file now gates on `hasScopedReach` (a caller with NO Fleet Ops scope at all
// lands on NoAccess) rather than issue #4's temporary `reachable.length > 0`
// shortcut, which stood in only while every screen was `loads: null`.

import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, RequireOperation, useAuthz, useScopes } from "./authz/gates";
import { SCREEN_ROUTES, hasScopedReach, reachableScreens } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { CallbackPage } from "./pages/Callback";
import { PlaceholderPage } from "./pages/Placeholder";
import { SettingsPage } from "./pages/Settings";
import { BusesPage } from "./pages/Buses";
import { NewBusPage } from "./pages/NewBus";
import { DevicesPage } from "./pages/Devices";
import { NewDevicePage } from "./pages/NewDevice";
import { RoutesPage } from "./pages/Routes";
import { NewRoutePage } from "./pages/NewRoute";

export const APP_NAME = "Fleet Ops";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  fleetmap: <PlaceholderPage title="Fleet map" />,
  buses: <BusesPage />,
  newbus: <NewBusPage />,
  devices: <DevicesPage />,
  newdevice: <NewDevicePage />,
  routes: <RoutesPage />,
  newroute: <NewRoutePage />,
};

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

  // The NoAccess question: does this caller hold ANY Fleet Ops scope at all?
  // Not "is `reachable` empty" — FleetMap's `loads: null` would make that true
  // for any signed-in caller, scoped or not.
  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  // Safe: hasScopedReach just proved at least one scope-gated screen is here.
  const landing = (reachable.find((screen) => !screen.public && screen.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
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
