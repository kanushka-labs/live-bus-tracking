// wireframes.dsl: screen NewDevice "Register a GPS device" — select "Assign
// to bus", Cancel -> Devices, Register (primary) -> Devices. Register calls
// POST /devices, which answers DeviceCredentials: an id AND a secret, shown
// exactly once. That secret is surfaced in a dialog with a copy affordance
// before the screen returns to Devices, since it is never retrievable again.

import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Form,
  IconButton,
  InputAdornment,
  MenuItem,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Copy } from "@wso2/oxygen-ui-icons-react";
import { fleetApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/fleet-api";

type Bus = components["schemas"]["Bus"];
type DeviceCredentials = components["schemas"]["DeviceCredentials"];

export function NewDevicePage(): ReactElement {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[] | null>(null);
  const [busId, setBusId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<DeviceCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error: getError } = await fleetApi.GET("/buses", {});
      if (!getError) setBuses(data.data);
    })();
  }, []);

  const submit = async () => {
    if (busId === "") {
      setError("Choose a bus to assign this device to.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data, error: postError } = await fleetApi.POST("/devices", { body: { busId } });
    setSubmitting(false);
    if (postError) {
      setError("Could not register the device.");
      return;
    }
    setIssued(data);
  };

  const copySecret = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Register device</PageTitle.Header>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Form.Section>
        <Form.Stack spacing={2} sx={{ maxWidth: 420 }}>
          <TextField select fullWidth label="Assign to bus" value={busId} onChange={(event) => setBusId(event.target.value)}>
            {(buses ?? []).map((bus) => (
              <MenuItem key={bus.id} value={bus.id}>
                {bus.licensePlate}
              </MenuItem>
            ))}
          </TextField>
        </Form.Stack>
      </Form.Section>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={() => navigate("/devices")}>Cancel</Button>
          <Can op="POST /devices">
            <Button variant="contained" disabled={submitting} onClick={() => void submit()}>
              Register
            </Button>
          </Can>
        </Stack>
      </Box>

      <Dialog open={issued !== null} maxWidth="sm" fullWidth>
        <DialogTitle>Device registered</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{issued?.id}</strong> is registered and assigned. Its secret is shown only once, now — copy it
              before leaving this screen; it cannot be retrieved again.
            </Typography>
            <TextField
              label="Device secret"
              value={issued?.secret ?? ""}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="Copy secret" onClick={() => void copySecret()}>
                        <Copy size={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              fullWidth
            />
            {copied ? (
              <Alert severity="success" sx={{ py: 0 }}>
                Copied to clipboard.
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => navigate("/devices")}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </PageContent>
  );
}
