// A bare placeholder for a sidebar destination whose real screen is a later
// issue's job (#6 for Buses/Devices/Routes/FleetMap). This issue is the app
// shell only — do not grow this into feature content; one component is reused
// across every placeholder route rather than four near-identical ones.

import type { ReactElement } from "react";
import { PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";

export function PlaceholderPage({ title }: { title: string }): ReactElement {
  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{title}</PageTitle.Header>
      </PageTitle>
      <Typography variant="body1" color="text.secondary">
        This screen is not built yet — it arrives in a later issue.
      </Typography>
    </PageContent>
  );
}
