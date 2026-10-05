// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS (thunder-authentication). All
// it says about each one is which API operation it LOADS; the gate follows
// from the contract, projected into ./operations.gen.ts.
//
// Issue #6 gives Buses, Devices and Routes (and their "New…" forms) their
// first real `loads` values. Fleet map (FleetMap/F3) is a different
// milestone's screen — it stays `loads: null`, reachable by any signed-in
// caller but gating nothing, until F3 lands it.
//
// RAIL ORDER matches the wireframes' screen declaration order (also the
// shared sidebar string: "Fleet map -> FleetMap | Buses -> Buses | Devices ->
// Devices | Routes -> Routes"). The three "New…" form screens are reached by
// a button from their list screen, not from the sidebar, so each carries no
// `sidebar` flag; `sidebar: true` marks the four rail items the wireframe's
// `sidebar` line actually draws.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
  /** Shown as its own item in the app shell's sidebar rail. */
  readonly sidebar?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "fleetmap", label: "Fleet map", path: "/fleet-map", loads: null, sidebar: true },
  { key: "buses", label: "Buses", path: "/buses", loads: "GET /buses", sidebar: true },
  { key: "newbus", label: "Register bus", path: "/buses/new", loads: "POST /buses" },
  { key: "devices", label: "Devices", path: "/devices", loads: "GET /devices", sidebar: true },
  { key: "newdevice", label: "Register device", path: "/devices/new", loads: "POST /devices" },
  { key: "routes", label: "Routes", path: "/routes", loads: "GET /routes", sidebar: true },
  // Also serves editing an existing route (?routeId=…), PATCHed with the same
  // fleet:manage scope as POST /routes — see src/pages/NewRoute.tsx. No
  // separate "EditRoute" screen exists anywhere, including here.
  { key: "newroute", label: "Define route", path: "/routes/new", loads: "POST /routes" },
];

for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

/**
 * Does this caller reach anything their scopes actually earned them? The
 * NoAccess question — not "is `reachableScreens` empty", since FleetMap's
 * `loads: null` would make that true for any signed-in caller, scoped or not.
 */
export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
