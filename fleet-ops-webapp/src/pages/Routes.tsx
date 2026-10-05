// wireframes.dsl: screen Routes "Defined routes and stops" — table "Route |
// Stops | -" with a per-row Edit action, and "Define route..." -> NewRoute.
//
// Edit reuses NewRoute (wireframes.dsl draws no separate "EditRoute" screen):
// navigating to /routes/new?routeId=<id> prefills NewRoutePage from this
// screen's own GET /routes data and switches its submit to PATCH
// /routes/{routeId}.

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, ListingTable, PageContent, PageTitle } from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { fleetApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/fleet-api";

type RouteRecord = components["schemas"]["Route"];

export function RoutesPage(): ReactElement {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: getError } = await fleetApi.GET("/routes", {});
    if (getError) {
      setError("Could not load routes.");
    } else {
      setRoutes(data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Routes</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /routes">
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/routes/new")}>
              Define route...
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <ListingTable.Container disablePaper>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Route</ListingTable.Cell>
              <ListingTable.Cell>Stops</ListingTable.Cell>
              <ListingTable.Cell align="right">-</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : routes && routes.length > 0 ? (
              routes.map((route) => (
                <ListingTable.Row key={route.id}>
                  <ListingTable.Cell>{route.name}</ListingTable.Cell>
                  <ListingTable.Cell>
                    {route.stops.length} {route.stops.length === 1 ? "stop" : "stops"}
                  </ListingTable.Cell>
                  <ListingTable.Cell align="right">
                    <Can op="PATCH /routes/{routeId}">
                      <ListingTable.RowActions>
                        <Button size="small" onClick={() => navigate(`/routes/new?routeId=${route.id}`)}>
                          Edit
                        </Button>
                      </ListingTable.RowActions>
                    </Can>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            ) : (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState
                    title="No routes yet"
                    description="Define your first route to get started."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>
    </PageContent>
  );
}
