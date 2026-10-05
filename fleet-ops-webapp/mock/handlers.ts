// The SERVICE half of mock mode — fleet-api's own data, ownership and 404s.
// mock/authz/gateway.ts is the GATEWAY half (the 401s) and runs ahead of this;
// no handler below re-checks a scope (react-webapp's mock-mode.md).
//
// STATE LIVES IN MODULE SCOPE, so the app behaves like an app within one
// mock session: registering a bus shows up in the next GET /buses, a PATCH
// persists for subsequent reads. A full page load (reload, typed URL, a link
// that leaves the SPA) re-runs this module and resets to the seed rows below —
// only in-app navigation carries a change forward.
//
// Seed rows are wireframes.dsl's own Buses/Devices/Routes tables (run
// `node "$AEP_SKILLS_DIR/wireframes/scripts/seed.mjs" specs/design/components/fleet-ops-webapp/wireframes.dsl`
// to reproduce them), so the running screens' numbers agree with the drawn
// wireframe by construction. Route 4's stop NAMES also come from NewRoute's
// drawn `list` ("Main St & 1st", "Main St & 5th", "Central Station"); its
// remaining three and Route 2's four stops are invented to round out the
// wireframe's "6 stops" / "4 stops" counts, since the wireframe draws only a
// count for those two rows.

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/fleet-api";

type Bus = components["schemas"]["Bus"];
type NewBus = components["schemas"]["NewBus"];
type BusUpdate = components["schemas"]["BusUpdate"];
type Route = components["schemas"]["Route"];
type NewRoute = components["schemas"]["NewRoute"];
type Stop = components["schemas"]["Stop"];
type Device = components["schemas"]["Device"];
type NewDevice = components["schemas"]["NewDevice"];
type DeviceCredentials = components["schemas"]["DeviceCredentials"];
type DeviceUpdate = components["schemas"]["DeviceUpdate"];

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

let buses: Bus[] = [
  { id: "bus-1", licensePlate: "ABC-123", active: true, routeId: "route-4" },
  { id: "bus-2", licensePlate: "XYZ-789", active: false, routeId: null },
];

let routes: Route[] = [
  {
    id: "route-4",
    name: "Route 4",
    stops: [
      { name: "Main St & 1st", sequence: 0, lat: 37.7749, lng: -122.4194 },
      { name: "Main St & 5th", sequence: 1, lat: 37.7755, lng: -122.418 },
      { name: "Central Station", sequence: 2, lat: 37.776, lng: -122.417 },
      { name: "Oak Ave & 2nd", sequence: 3, lat: 37.777, lng: -122.416 },
      { name: "Elm St & 3rd", sequence: 4, lat: 37.778, lng: -122.415 },
      { name: "Park Terminal", sequence: 5, lat: 37.779, lng: -122.414 },
    ],
  },
  {
    id: "route-2",
    name: "Route 2",
    stops: [
      { name: "5th Ave & Broadway", sequence: 0, lat: 37.77, lng: -122.41 },
      { name: "City Hall", sequence: 1, lat: 37.771, lng: -122.411 },
      { name: "Union Square", sequence: 2, lat: 37.772, lng: -122.412 },
      { name: "Ferry Terminal", sequence: 3, lat: 37.773, lng: -122.413 },
    ],
  },
];

let devices: Device[] = [
  { id: "DEV-0012", busId: "bus-1", active: true, lastUpdateAt: minutesAgo(0) },
  { id: "DEV-0007", busId: "bus-2", active: false, lastUpdateAt: minutesAgo(6) },
];

let busSeq = 3;
let routeSeq = 3;
let deviceSeq = 13;

function nextBusId(): string {
  return `bus-${String(busSeq++)}`;
}
function nextRouteId(): string {
  return `route-${String(routeSeq++)}`;
}
function nextDeviceId(): string {
  return `DEV-${String(deviceSeq++).padStart(4, "0")}`;
}
function randomSecret(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

function errorBody(code: number, message: string): { code: number; message: string } {
  return { code, message };
}

function isStopArray(value: unknown): value is Stop[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { name?: unknown }).name === "string" &&
        typeof (item as { lat?: unknown }).lat === "number" &&
        typeof (item as { lng?: unknown }).lng === "number",
    )
  );
}

export const handlers = [
  // ---- Buses ---------------------------------------------------------------

  http.get("/api/buses", () => {
    return HttpResponse.json({ count: buses.length, next: null, previous: null, data: buses });
  }),

  http.post("/api/buses", async ({ request }) => {
    const input = (await request.json()) as Partial<NewBus>;
    if (!input?.licensePlate || input.licensePlate.trim() === "") {
      return HttpResponse.json(errorBody(400, "licensePlate is required"), { status: 400 });
    }
    const created: Bus = { id: nextBusId(), licensePlate: input.licensePlate, active: true, routeId: null };
    buses = [...buses, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("/api/buses/:busId", async ({ request, params }) => {
    const bus = buses.find((b) => b.id === params.busId);
    if (!bus) {
      return HttpResponse.json(errorBody(404, "bus not found"), { status: 404 });
    }
    const input = (await request.json()) as BusUpdate;
    const updated: Bus = {
      ...bus,
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.routeId !== undefined ? { routeId: input.routeId } : {}),
    };
    buses = buses.map((b) => (b.id === updated.id ? updated : b));
    return HttpResponse.json(updated);
  }),

  // ---- Routes ---------------------------------------------------------------

  http.get("/api/routes", () => {
    return HttpResponse.json({ count: routes.length, next: null, previous: null, data: routes });
  }),

  http.post("/api/routes", async ({ request }) => {
    const input = (await request.json()) as Partial<NewRoute>;
    if (!input?.name || input.name.trim() === "") {
      return HttpResponse.json(errorBody(400, "name is required"), { status: 400 });
    }
    if (!isStopArray(input.stops) || input.stops.length === 0) {
      return HttpResponse.json(errorBody(400, "at least one stop is required"), { status: 400 });
    }
    const created: Route = {
      id: nextRouteId(),
      name: input.name,
      stops: input.stops.map((stop, index) => ({ ...stop, sequence: index })),
    };
    routes = [...routes, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("/api/routes/:routeId", async ({ request, params }) => {
    const route = routes.find((r) => r.id === params.routeId);
    if (!route) {
      return HttpResponse.json(errorBody(404, "route not found"), { status: 404 });
    }
    const input = (await request.json()) as Partial<NewRoute>;
    if (!input?.name || input.name.trim() === "") {
      return HttpResponse.json(errorBody(400, "name is required"), { status: 400 });
    }
    if (!isStopArray(input.stops) || input.stops.length === 0) {
      return HttpResponse.json(errorBody(400, "at least one stop is required"), { status: 400 });
    }
    const updated: Route = {
      id: route.id,
      name: input.name,
      stops: input.stops.map((stop, index) => ({ ...stop, sequence: index })),
    };
    routes = routes.map((r) => (r.id === updated.id ? updated : r));
    return HttpResponse.json(updated);
  }),

  // ---- Devices ---------------------------------------------------------------

  http.get("/api/devices", () => {
    return HttpResponse.json({ count: devices.length, next: null, previous: null, data: devices });
  }),

  http.post("/api/devices", async ({ request }) => {
    const input = (await request.json()) as Partial<NewDevice>;
    if (!input?.busId || input.busId.trim() === "") {
      return HttpResponse.json(errorBody(400, "busId is required"), { status: 400 });
    }
    if (!buses.some((b) => b.id === input.busId)) {
      return HttpResponse.json(errorBody(400, "busId does not name a registered bus"), { status: 400 });
    }
    const created: Device = { id: nextDeviceId(), busId: input.busId, active: true, lastUpdateAt: null };
    devices = [...devices, created];
    const credentials: DeviceCredentials = { ...created, secret: randomSecret() };
    return HttpResponse.json(credentials, { status: 201 });
  }),

  http.patch("/api/devices/:deviceId", async ({ request, params }) => {
    const device = devices.find((d) => d.id === params.deviceId);
    if (!device) {
      return HttpResponse.json(errorBody(404, "device not found"), { status: 404 });
    }
    const input = (await request.json()) as DeviceUpdate;
    if (input.busId !== undefined && !buses.some((b) => b.id === input.busId)) {
      return HttpResponse.json(errorBody(400, "busId does not name a registered bus"), { status: 400 });
    }
    const updated: Device = {
      ...device,
      ...(input.busId !== undefined ? { busId: input.busId } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    };
    devices = devices.map((d) => (d.id === updated.id ? updated : d));
    return HttpResponse.json(updated);
  }),
];
