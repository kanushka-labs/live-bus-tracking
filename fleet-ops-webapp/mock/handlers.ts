// This issue (#4) is the app shell only — no feature screen calls fleet-api
// yet, so there is nothing for a service-layer mock to answer. mock/browser.ts
// imports `handlers` unconditionally, so the export has to exist even empty:
// every /api call still passes through mock/authz/gateway.ts first (the 401s,
// read from fleet-api's openapi.yaml) and then falls through to the 501
// catch-all, which is the correct and honest answer for a call no screen makes
// yet.
//
// Issue #6 adds the Buses/Devices/Routes/FleetMap screens and their handlers
// here, seeded per react-webapp's mock-mode.md.

import type { RequestHandler } from "msw";

export const handlers: RequestHandler[] = [];
