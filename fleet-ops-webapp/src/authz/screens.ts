// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS (thunder-authentication). All
// it says about each one is which API operation it LOADS; the gate follows
// from the contract, projected into ./operations.gen.ts.
//
// Issue #4 (this one) is the app shell only — Fleet map, Buses, Devices and
// Routes are the wireframes' sidebar items (wireframes.dsl), but the screens
// behind them (issue #6) do not exist yet, so there is no API call for any of
// them to load. Every row below is therefore `loads: null`: reachable by any
// signed-in caller, gating on nothing. That is a deliberate, temporary fact —
// re-derive each `loads` once #6 lands its screens and swap it to the
// operation the screen actually loads (e.g. "GET /buses" for Buses).
//
// RAIL ORDER matches the wireframes' shared sidebar string: "Fleet map ->
// FleetMap | Buses -> Buses | Devices -> Devices | Routes -> Routes".

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "fleetmap", label: "Fleet map", path: "/fleet-map", loads: null },
  { key: "buses", label: "Buses", path: "/buses", loads: null },
  { key: "devices", label: "Devices", path: "/devices", loads: null },
  { key: "routes", label: "Routes", path: "/routes", loads: null },
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
 * Does this caller reach anything their scopes actually earned them?
 *
 * Every screen in this table is `loads: null` (see the file comment above), so
 * this is always false today — `reachableScreens` is the question App.tsx asks
 * instead while that holds. Keep this function here, unused, so it is ready the
 * moment #6 gives a screen a real `loads` and this starts meaning something
 * again.
 */
export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
