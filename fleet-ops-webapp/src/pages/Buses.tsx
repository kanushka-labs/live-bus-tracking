// wireframes.dsl: screen Buses "Registered buses" — table "License plate |
// Route | Active | -" with a per-row Activate/Deactivate action, and
// "Register bus..." -> NewBus.
//
// The Route column is filled by ONE extra request to GET /routes, joined on
// id (oxygen-ui-design-system's "a column the list endpoint does not return
// is filled from one bulk request to another list operation").
//
// DEVIATION FROM THE DRAWN TABLE: the wireframe's only row action is
// Activate/Deactivate, but F1.6 requires assigning/reassigning a bus to a
// route through this screen, and no other screen draws that control either.
// Added a second row action, "Assign route", opening a small dialog — the
// same choice the issue text invites for Devices' Reassign.

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListingTable,
  MenuItem,
  PageContent,
  PageTitle,
  Stack,
  TextField,
} from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { fleetApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/fleet-api";

type Bus = components["schemas"]["Bus"];
type RouteRecord = components["schemas"]["Route"];

export function BusesPage(): ReactElement {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[] | null>(null);
  const [routes, setRoutes] = useState<RouteRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<Bus | null>(null);
  const [chosenRouteId, setChosenRouteId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [busesResult, routesResult] = await Promise.all([fleetApi.GET("/buses", {}), fleetApi.GET("/routes", {})]);
    if (busesResult.error) {
      setError("Could not load buses.");
    } else {
      setBuses(busesResult.data.data);
    }
    if (!routesResult.error) {
      setRoutes(routesResult.data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const routeName = (routeId: string | null | undefined): string => {
    if (!routeId) return "Unassigned";
    return routes?.find((route) => route.id === routeId)?.name ?? routeId;
  };

  const toggleActive = async (bus: Bus) => {
    setBusyId(bus.id);
    const { data, error: patchError } = await fleetApi.PATCH("/buses/{busId}", {
      params: { path: { busId: bus.id } },
      body: { active: !bus.active },
    });
    if (!patchError) {
      setBuses((prev) => prev?.map((b) => (b.id === data.id ? data : b)) ?? prev);
    }
    setBusyId(null);
  };

  const openAssign = (bus: Bus) => {
    setAssigning(bus);
    setChosenRouteId(bus.routeId ?? "");
  };

  const saveAssignment = async () => {
    if (!assigning) return;
    setBusyId(assigning.id);
    const { data, error: patchError } = await fleetApi.PATCH("/buses/{busId}", {
      params: { path: { busId: assigning.id } },
      body: { routeId: chosenRouteId === "" ? null : chosenRouteId },
    });
    if (!patchError) {
      setBuses((prev) => prev?.map((b) => (b.id === data.id ? data : b)) ?? prev);
      setAssigning(null);
    }
    setBusyId(null);
  };

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Buses</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /buses">
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/buses/new")}>
              Register bus...
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
              <ListingTable.Cell>License plate</ListingTable.Cell>
              <ListingTable.Cell>Route</ListingTable.Cell>
              <ListingTable.Cell>Active</ListingTable.Cell>
              <ListingTable.Cell align="right">-</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={4}>
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : buses && buses.length > 0 ? (
              buses.map((bus) => (
                <ListingTable.Row key={bus.id}>
                  <ListingTable.Cell>{bus.licensePlate}</ListingTable.Cell>
                  <ListingTable.Cell>{routeName(bus.routeId)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={bus.active ? "Yes" : "No"} color={bus.active ? "success" : "default"} size="small" />
                  </ListingTable.Cell>
                  <ListingTable.Cell align="right">
                    <Can op="PATCH /buses/{busId}">
                      <ListingTable.RowActions>
                        <Button size="small" disabled={busyId === bus.id} onClick={() => openAssign(bus)}>
                          Assign route
                        </Button>
                        <Button size="small" disabled={busyId === bus.id} onClick={() => void toggleActive(bus)}>
                          {bus.active ? "Deactivate" : "Activate"}
                        </Button>
                      </ListingTable.RowActions>
                    </Can>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            ) : (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={4}>
                  <ListingTable.EmptyState
                    title="No buses yet"
                    description="Register your first bus to get started."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>

      <Dialog open={assigning !== null} onClose={() => setAssigning(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign {assigning?.licensePlate} to a route</DialogTitle>
        <DialogContent>
          <Stack sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Route"
              value={chosenRouteId}
              onChange={(event) => setChosenRouteId(event.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {(routes ?? []).map((route) => (
                <MenuItem key={route.id} value={route.id}>
                  {route.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssigning(null)}>Cancel</Button>
          <Button variant="contained" disabled={busyId === assigning?.id} onClick={() => void saveAssignment()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageContent>
  );
}
