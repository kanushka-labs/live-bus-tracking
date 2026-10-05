// wireframes.dsl: screen NewRoute "Define a route" — input "Route name",
// an editable ordered `list` of stops, "Add stop..." button, Cancel -> Routes,
// "Save route" (primary) -> Routes. Save calls POST /routes for a new route.
//
// Also serves EDITING an existing route: Routes' "Edit" action navigates here
// with ?routeId=<id> (no separate "EditRoute" screen is drawn anywhere), which
// prefills this form from GET /routes and switches Save to
// PATCH /routes/{routeId} — the same fleet:manage scope as POST /routes, so
// gating this screen on "POST /routes" (src/authz/screens.ts) is correct for
// both paths.
//
// Each stop row adds a delete control beyond what the wireframe's bare `list`
// draws — an "editable ordered stop list" needs a way to remove a stop, and
// the wireframe gives no other place to put one.

import { useEffect, useState, type ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Form,
  IconButton,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Plus, Trash2 } from "@wso2/oxygen-ui-icons-react";
import { fleetApi } from "../api";
import { Can } from "../authz/gates";

interface StopDraft {
  name: string;
  lat: string;
  lng: string;
}

const BLANK_STOP: StopDraft = { name: "", lat: "", lng: "" };

export function NewRoutePage(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("routeId");

  const [name, setName] = useState("");
  const [stops, setStops] = useState<StopDraft[]>([{ ...BLANK_STOP }]);
  const [loading, setLoading] = useState(routeId !== null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId) return;
    void (async () => {
      setLoading(true);
      const { data, error: getError } = await fleetApi.GET("/routes", {});
      if (getError) {
        setError("Could not load the route to edit.");
        setLoading(false);
        return;
      }
      const route = data.data.find((candidate) => candidate.id === routeId);
      if (!route) {
        setError("That route no longer exists.");
        setLoading(false);
        return;
      }
      setName(route.name);
      setStops(
        [...route.stops]
          .sort((a, b) => a.sequence - b.sequence)
          .map((stop) => ({ name: stop.name, lat: String(stop.lat), lng: String(stop.lng) })),
      );
      setLoading(false);
    })();
  }, [routeId]);

  const updateStop = (index: number, patch: Partial<StopDraft>) => {
    setStops((prev) => prev.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)));
  };

  const addStop = () => setStops((prev) => [...prev, { ...BLANK_STOP }]);
  const removeStop = (index: number) => setStops((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (name.trim() === "") {
      setError("Route name is required.");
      return;
    }
    if (stops.length === 0) {
      setError("A route needs at least one stop.");
      return;
    }
    const parsedStops = stops.map((stop, index) => ({
      name: stop.name.trim(),
      sequence: index,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
    }));
    if (parsedStops.some((stop) => stop.name === "" || Number.isNaN(stop.lat) || Number.isNaN(stop.lng))) {
      setError("Every stop needs a name, a latitude and a longitude.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const body = { name: name.trim(), stops: parsedStops };
    const { error: saveError } = routeId
      ? await fleetApi.PATCH("/routes/{routeId}", { params: { path: { routeId } }, body })
      : await fleetApi.POST("/routes", { body });
    setSubmitting(false);
    if (saveError) {
      setError(routeId ? "Could not save the route." : "Could not define the route.");
      return;
    }
    navigate("/routes");
  };

  if (loading) {
    return (
      <PageContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{routeId ? "Edit route" : "Define route"}</PageTitle.Header>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Form.Section>
        <Form.Stack spacing={3} sx={{ maxWidth: 640 }}>
          <TextField label="Route name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Stops, in order
            </Typography>
            <Stack spacing={2}>
              {stops.map((stop, index) => (
                <Stack key={`stop-${String(index)}`} direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                    {index + 1}
                  </Typography>
                  <TextField
                    label={`Stop ${String(index + 1)}`}
                    value={stop.name}
                    onChange={(event) => updateStop(index, { name: event.target.value })}
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Latitude"
                    value={stop.lat}
                    onChange={(event) => updateStop(index, { lat: event.target.value })}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Longitude"
                    value={stop.lng}
                    onChange={(event) => updateStop(index, { lng: event.target.value })}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    aria-label={`Remove stop ${String(index + 1)}`}
                    onClick={() => removeStop(index)}
                    disabled={stops.length <= 1}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            <Button startIcon={<Plus size={18} />} onClick={addStop} sx={{ mt: 2 }}>
              Add stop...
            </Button>
          </Box>
        </Form.Stack>
      </Form.Section>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={() => navigate("/routes")}>Cancel</Button>
          <Can op="POST /routes">
            <Button variant="contained" disabled={submitting} onClick={() => void submit()}>
              Save route
            </Button>
          </Can>
        </Stack>
      </Box>
    </PageContent>
  );
}
