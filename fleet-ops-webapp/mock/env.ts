// mock/plugin.ts serves this as window._env_ under `--mode mock`. It carries
// exactly the keys the platform actually emits for this component (the four
// USER_AUTH_* OIDC keys src/env.ts declares) and nothing else — in particular
// no sibling API URL, which production never emits either (react-webapp).

export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  // The OIDC scopes are `group` and `ou`, SINGULAR, plus every handle this
  // project's catalog declares (specs/design/security.json) — exactly as the
  // platform would request them for a real sign-in.
  USER_AUTH_SCOPES:
    "openid profile email group ou fleet:read fleet:manage devices:read devices:manage positions:read",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
