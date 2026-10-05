// wireframes.dsl: screen Devices "Registered GPS devices" — heading "GPS
// devices", table "Device ID | Assigned bus | Active | Last update | -" with
// a per-row Reassign action, and "Register device..." -> NewDevice.
//
// The Assigned bus column is filled by ONE extra request to GET /buses,
// joined on id — but ONLY when the caller holds fleet:read. This screen's own
// `loads` is "GET /devices" (devices:read), which Dispatcher holds without
// fleet:read (security.json), so an unconditional GET /buses here would 401
// for that role and the app's global 401 rule (src/authz/client.ts, verbatim)
// would bounce a Dispatcher who legitimately opened this screen straight to
// /forbidden. A caller who cannot see bus plates sees the raw bus id instead
// — degraded, never a page they are refused outright.
//
// Reassign opens a small dialog (the issue text's own suggestion) rather than
// a separate screen — the wireframe draws none.
//
// DEVIATION FROM THE DRAWN TABLE: the wireframe's only row action is
// Reassign, but F1.4 requires marking a device active/inactive through this
// screen too, so a second row action is added for that, mirroring Buses.

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
import { Can, useScopes } from "../authz/gates";
import { canCall } from "../authz/core";
import { OPERATIONS } from "../authz/operations.gen";
import type { components } from "../generated/fleet-api";

type Device = components["schemas"]["Device"];
type Bus = components["schemas"]["Bus"];

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${String(minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 hour ago" : `${String(hours)} hours ago`;
}

export function DevicesPage(): ReactElement {
  const navigate = useNavigate();
  const scopes = useScopes();
  const canSeeBuses = canCall(OPERATIONS["GET /buses"], scopes, true);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [buses, setBuses] = useState<Bus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<Device | null>(null);
  const [chosenBusId, setChosenBusId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [devicesResult, busesResult] = await Promise.all([
      fleetApi.GET("/devices", {}),
      canSeeBuses ? fleetApi.GET("/buses", {}) : Promise.resolve(null),
    ]);
    if (devicesResult.error) {
      setError("Could not load devices.");
    } else {
      setDevices(devicesResult.data.data);
    }
    if (busesResult && !busesResult.error) {
      setBuses(busesResult.data.data);
    }
    setLoading(false);
  }, [canSeeBuses]);

  useEffect(() => {
    void load();
  }, [load]);

  const busPlate = (busId: string): string => buses?.find((bus) => bus.id === busId)?.licensePlate ?? busId;

  const toggleActive = async (device: Device) => {
    setBusyId(device.id);
    const { data, error: patchError } = await fleetApi.PATCH("/devices/{deviceId}", {
      params: { path: { deviceId: device.id } },
      body: { active: !device.active },
    });
    if (!patchError) {
      setDevices((prev) => prev?.map((d) => (d.id === data.id ? data : d)) ?? prev);
    }
    setBusyId(null);
  };

  const openReassign = (device: Device) => {
    setReassigning(device);
    setChosenBusId(device.busId);
  };

  const saveReassign = async () => {
    if (!reassigning || chosenBusId === "") return;
    setBusyId(reassigning.id);
    const { data, error: patchError } = await fleetApi.PATCH("/devices/{deviceId}", {
      params: { path: { deviceId: reassigning.id } },
      body: { busId: chosenBusId },
    });
    if (!patchError) {
      setDevices((prev) => prev?.map((d) => (d.id === data.id ? data : d)) ?? prev);
      setReassigning(null);
    }
    setBusyId(null);
  };

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>GPS devices</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /devices">
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/devices/new")}>
              Register device...
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
              <ListingTable.Cell>Device ID</ListingTable.Cell>
              <ListingTable.Cell>Assigned bus</ListingTable.Cell>
              <ListingTable.Cell>Active</ListingTable.Cell>
              <ListingTable.Cell>Last update</ListingTable.Cell>
              <ListingTable.Cell align="right">-</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={5}>
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : devices && devices.length > 0 ? (
              devices.map((device) => (
                <ListingTable.Row key={device.id}>
                  <ListingTable.Cell>{device.id}</ListingTable.Cell>
                  <ListingTable.Cell>{busPlate(device.busId)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip
                      label={device.active ? "Yes" : "No"}
                      color={device.active ? "success" : "default"}
                      size="small"
                    />
                  </ListingTable.Cell>
                  <ListingTable.Cell>{relativeTime(device.lastUpdateAt)}</ListingTable.Cell>
                  <ListingTable.Cell align="right">
                    <Can op="PATCH /devices/{deviceId}">
                      <ListingTable.RowActions>
                        <Button size="small" disabled={busyId === device.id} onClick={() => openReassign(device)}>
                          Reassign
                        </Button>
                        <Button size="small" disabled={busyId === device.id} onClick={() => void toggleActive(device)}>
                          {device.active ? "Deactivate" : "Activate"}
                        </Button>
                      </ListingTable.RowActions>
                    </Can>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            ) : (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={5}>
                  <ListingTable.EmptyState
                    title="No devices yet"
                    description="Register your first GPS device to get started."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>

      <Dialog open={reassigning !== null} onClose={() => setReassigning(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reassign {reassigning?.id} to a bus</DialogTitle>
        <DialogContent>
          <Stack sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Bus"
              value={chosenBusId}
              onChange={(event) => setChosenBusId(event.target.value)}
            >
              {(buses ?? []).map((bus) => (
                <MenuItem key={bus.id} value={bus.id}>
                  {bus.licensePlate}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassigning(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={busyId === reassigning?.id || chosenBusId === ""}
            onClick={() => void saveReassign()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageContent>
  );
}
