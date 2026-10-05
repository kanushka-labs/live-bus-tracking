// wireframes.dsl: screen NewBus "Register a new bus" — input "License plate",
// Cancel -> Buses, Register (primary) -> Buses. Register calls POST /buses.

import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { fleetApi } from "../api";
import { Can } from "../authz/gates";

export function NewBusPage(): ReactElement {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (licensePlate.trim() === "") {
      setError("License plate is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: postError } = await fleetApi.POST("/buses", { body: { licensePlate: licensePlate.trim() } });
    setSubmitting(false);
    if (postError) {
      setError("Could not register the bus.");
      return;
    }
    navigate("/buses");
  };

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Register bus</PageTitle.Header>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Form.Section>
        <Form.Stack spacing={2} sx={{ maxWidth: 420 }}>
          <TextField
            label="License plate"
            value={licensePlate}
            onChange={(event) => setLicensePlate(event.target.value)}
            fullWidth
          />
        </Form.Stack>
      </Form.Section>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={() => navigate("/buses")}>Cancel</Button>
          <Can op="POST /buses">
            <Button variant="contained" disabled={submitting} onClick={() => void submit()}>
              Register
            </Button>
          </Can>
        </Stack>
      </Box>
    </PageContent>
  );
}
