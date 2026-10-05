// The fleet-api client: generated types from its openapi.yaml, called
// same-origin through nginx's /api proxy. No sibling URL is ever read from
// window._env_ — see src/env.ts.
//
// Authorization is NOT this module's concern: it calls through
// src/authz/client.ts's authorizationHeader()/classifyResponse(), exactly as
// thunder-authentication prescribes, and adds nothing of its own about it.

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/fleet-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const fleetApi = createClient<paths>({ baseUrl: "/api" });
fleetApi.use(authMiddleware);
