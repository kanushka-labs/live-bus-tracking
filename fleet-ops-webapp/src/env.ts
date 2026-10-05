// Typed read of window._env_, the platform's runtime config shim. The platform
// mounts /env-config.js into the served root at request time — never at build
// time, so this is the only correct way to read per-env config in this app.
//
// The four USER_AUTH_* keys are the OIDC config for the `user-auth`
// platform-resource dependency (design.json), UPPER_SNAKE of its name. Not
// here: USER_AUTH_JWKS_URL — the browser never validates a token, the API
// gateway does, so no asset in this app reads it.
//
// There is no sibling-API URL key here on purpose: fleet-api is a
// `component`-kind dependency reached same-origin at /api (nginx proxies it),
// never through window._env_ (react-webapp).

type Env = {
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
