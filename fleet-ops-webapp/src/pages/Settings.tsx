// App-shell chrome shared by every feature (not a wireframe screen — see
// wireframes.dsl, which draws no Settings screen). Reachable from the account
// menu and the sidebar footer for any signed-in caller; it names no operation
// to gate on, because it shows only the caller's own session, nothing fetched
// from fleet-api.

import type { ReactElement } from "react";
import { Card, CardContent, PageContent, PageTitle, Stack, Typography } from "@wso2/oxygen-ui";
import { useAuthz, useHeldRoles } from "../authz/gates";

export function SettingsPage(): ReactElement {
  const { username } = useAuthz();
  const roles = useHeldRoles();

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Settings</PageTitle.Header>
      </PageTitle>
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="h6">{username || "Unknown"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {roles.length > 0 ? `Role: ${roles.join(", ")}` : "No Fleet Ops role granted yet."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </PageContent>
  );
}
