import { useState, type ReactNode } from "react";
import {
  Alert, AppShell, Badge, Button, Detail, Dialog, Field, Form, Heading, Screen, Section, Stack, Text,
  Table, defineApp, useCollection, useDisplayState, useNav, useRole,
} from "@wso2/prototype-kit";

interface Bus {
  id: string;
  licensePlate: string;
  routeName: string;
  active: boolean;
}

interface Device {
  id: string;
  assignedBus: string;
  active: boolean;
  lastUpdate: string;
}

interface RouteRecord {
  id: string;
  name: string;
  stopsCount: number;
}

interface FleetPosition {
  id: string;
  bus: string;
  route: string;
  deviceId: string;
  lastUpdate: string;
  status: string;
}

const buses: Bus[] = [
  { id: "bus-1", licensePlate: "ABC-123", routeName: "Route 4", active: true },
  { id: "bus-2", licensePlate: "XYZ-789", routeName: "Unassigned", active: false },
  { id: "bus-3", licensePlate: "QRS-456", routeName: "Route 2", active: true },
];

const devices: Device[] = [
  { id: "DEV-0012", assignedBus: "ABC-123", active: true, lastUpdate: "just now" },
  { id: "DEV-0007", assignedBus: "XYZ-789", active: false, lastUpdate: "6 min ago" },
  { id: "DEV-0003", assignedBus: "QRS-456", active: true, lastUpdate: "40 sec ago" },
];

const routes: RouteRecord[] = [
  { id: "route-4", name: "Route 4", stopsCount: 6 },
  { id: "route-2", name: "Route 2", stopsCount: 4 },
];

const fleetPositions: FleetPosition[] = [
  { id: "pos.12", bus: "Bus 12", route: "Route 4", deviceId: "DEV-0012", lastUpdate: "just now", status: "On route" },
  { id: "pos.7", bus: "Bus 7", route: "Route 2", deviceId: "DEV-0007", lastUpdate: "6 min ago", status: "Offline" },
  { id: "pos.3", bus: "Bus 3", route: "Route 4", deviceId: "DEV-0003", lastUpdate: "10 sec ago", status: "On route" },
];

const routeOptions = ["Unassigned", "Route 4", "Route 2"];

const users = {
  FleetAdmin: { name: "Priya Patel", email: "priya.patel@example.com" },
  Dispatcher: { name: "Dana Okonkwo", email: "dana.okonkwo@example.com" },
};

function Shell({ children }: { children: ReactNode }) {
  const role = useRole() as keyof typeof users;
  return (
    <AppShell
      id="shell"
      user={users[role] ?? users.FleetAdmin}
      nav={[
        { id: "nav.fleet-map", label: "Fleet map", to: "screen.fleet-map" },
        { id: "nav.buses", label: "Buses", to: "screen.buses" },
        { id: "nav.devices", label: "Devices", to: "screen.devices" },
        { id: "nav.routes", label: "Routes", to: "screen.routes" },
      ]}
      account="screen.account"
      settings="screen.settings"
      signOut="screen.signed-out"
    >
      {children}
    </AppShell>
  );
}

function FleetMap() {
  const state = useDisplayState();
  const all = useCollection<FleetPosition>("fleetPositions");
  const positions = state === "state.empty" ? [] : all.items;
  return (
    <Shell>
      <Heading id="heading.fleet-map" text="Fleet map" />
      <Stack direction="row">
        <Field id="field.search" label="Search bus or device" />
        <Badge id="badge.updates" label="Updates every few seconds" tone="info" />
      </Stack>
      {state === "state.failed" && (
        <Alert
          id="alert.feed-failed"
          tone="error"
          title="Live feed unavailable"
          text="Positions may be out of date. We're retrying in the background."
        />
      )}
      <Section id="section.map" title="Map">
        <Text
          id="text.map"
          text="Map showing every bus as a pin, color for on-route, muted with an Offline badge when stale."
        />
      </Section>
      <Section id="section.positions" title="Buses" count={positions.length} subtitle="Position, route, device and last update for every bus.">
        <Table
          id="table.positions"
          columns={["Bus", "Route", "Device ID", "Last update", { label: "Status", kind: "status" }]}
          rows={positions.map((p) => ({
            id: `pos.${p.id}`,
            cells: [p.bus, p.route, p.deviceId, p.lastUpdate],
            status: { text: p.status, tone: p.status === "Offline" ? "default" : "success" },
          }))}
          empty={<Text id="text.empty-positions" text="No buses are reporting right now." tone="secondary" />}
        />
      </Section>
    </Shell>
  );
}

function Buses() {
  const all = useCollection<Bus>("buses");
  const [assigning, setAssigning] = useState<string | null>(null);
  const target = assigning ? all.get(assigning) : undefined;
  return (
    <Shell>
      <Heading
        id="heading.buses"
        text="Buses"
        actions={<Button id="btn.new-bus" label="Register bus..." emphasis="primary" to="screen.new-bus" />}
      />
      <Section id="section.buses" title="Registered buses" count={all.items.length}>
        <Table
          id="table.buses"
          columns={["License plate", "Route", { label: "Active", kind: "text" }]}
          rows={all.items.map((b) => ({
            id: `bus.${b.id}`,
            cells: [b.licensePlate, b.routeName, b.active ? "Yes" : "No"],
            actions: [
              {
                id: `bus.${b.id}.toggle`,
                label: b.active ? "Deactivate" : "Activate",
                emphasis: b.active ? "danger" : undefined,
                onPress: () => all.update(b.id, { active: !b.active }),
              },
              {
                id: `bus.${b.id}.assign-route`,
                label: "Assign route",
                onPress: () => setAssigning(b.id),
              },
            ],
          }))}
          empty={<Text id="text.empty-buses" text="No buses registered yet." tone="secondary" />}
        />
      </Section>
      <Dialog
        id="dialog.assign-route"
        title={target ? `Assign a route to ${target.licensePlate}` : "Assign a route"}
        open={assigning !== null}
        onClose={() => setAssigning(null)}
      >
        <Form
          id="form.assign-route"
          onSubmit={(values) => {
            if (assigning) all.update(assigning, { routeName: values.route ?? "Unassigned" });
            setAssigning(null);
          }}
          actions={<Button id="btn.assign-route.confirm" label="Save" emphasis="primary" submit />}
        >
          <Field id="field.route" label="Route" type="select" options={routeOptions} defaultValue={target?.routeName ?? "Unassigned"} />
        </Form>
      </Dialog>
    </Shell>
  );
}

function NewBus() {
  const state = useDisplayState();
  const all = useCollection<Bus>("buses");
  const navigate = useNav();
  return (
    <Shell>
      <Heading id="heading.new-bus" text="Register bus" />
      <Form
        id="form.new-bus"
        onSubmit={(values) => {
          all.create({ licensePlate: values.licensePlate, routeName: "Unassigned", active: true });
          navigate.go("screen.buses");
        }}
        actions={
          <Stack direction="row">
            <Button id="btn.cancel" label="Cancel" to="screen.buses" />
            <Button id="btn.register" label="Register" emphasis="primary" submit />
          </Stack>
        }
      >
        <Field
          id="field.license-plate"
          label="License plate"
          required
          error={state === "state.validation-error" ? "Enter the bus's license plate" : undefined}
        />
      </Form>
    </Shell>
  );
}

function Devices() {
  const all = useCollection<Device>("devices");
  const [reassigning, setReassigning] = useState<string | null>(null);
  const target = reassigning ? all.get(reassigning) : undefined;
  return (
    <Shell>
      <Heading
        id="heading.devices"
        text="GPS devices"
        actions={<Button id="btn.new-device" label="Register device..." emphasis="primary" to="screen.new-device" />}
      />
      <Section id="section.devices" title="Registered devices" count={all.items.length}>
        <Table
          id="table.devices"
          columns={["Device ID", "Assigned bus", "Active", "Last update"]}
          rows={all.items.map((d) => ({
            id: `device.${d.id}`,
            cells: [d.id, d.assignedBus, d.active ? "Yes" : "No", d.lastUpdate],
            actions: [
              {
                id: `device.${d.id}.toggle`,
                label: d.active ? "Deactivate" : "Activate",
                emphasis: d.active ? "danger" : undefined,
                onPress: () => all.update(d.id, { active: !d.active }),
              },
              {
                id: `device.${d.id}.reassign`,
                label: "Reassign",
                onPress: () => setReassigning(d.id),
              },
            ],
          }))}
          empty={<Text id="text.empty-devices" text="No GPS devices registered yet." tone="secondary" />}
        />
      </Section>
      <Dialog
        id="dialog.reassign-device"
        title={target ? `Reassign ${target.id}` : "Reassign device"}
        open={reassigning !== null}
        onClose={() => setReassigning(null)}
      >
        <Form
          id="form.reassign-device"
          onSubmit={(values) => {
            if (reassigning) all.update(reassigning, { assignedBus: values.assignedBus ?? target?.assignedBus });
            setReassigning(null);
          }}
          actions={<Button id="btn.reassign-device.confirm" label="Save" emphasis="primary" submit />}
        >
          <Field
            id="field.assigned-bus"
            label="Assign to bus"
            type="select"
            options={buses.map((b) => b.licensePlate)}
            defaultValue={target?.assignedBus}
          />
        </Form>
      </Dialog>
    </Shell>
  );
}

function NewDevice() {
  const all = useCollection<Device>("devices");
  const navigate = useNav();
  return (
    <Shell>
      <Heading id="heading.new-device" text="Register device" />
      <Form
        id="form.new-device"
        onSubmit={(values) => {
          const id = `DEV-${String(all.items.length + 1).padStart(4, "0")}`;
          all.create({ assignedBus: values.assignedBus ?? buses[0]!.licensePlate, active: true, lastUpdate: "never" });
          void id;
          navigate.go("screen.devices");
        }}
        actions={
          <Stack direction="row">
            <Button id="btn.cancel" label="Cancel" to="screen.devices" />
            <Button id="btn.register" label="Register" emphasis="primary" submit />
          </Stack>
        }
      >
        <Field
          id="field.assign-to-bus"
          label="Assign to bus"
          type="select"
          options={buses.map((b) => b.licensePlate)}
          required
        />
      </Form>
    </Shell>
  );
}

function Routes() {
  const all = useCollection<RouteRecord>("routes");
  return (
    <Shell>
      <Heading
        id="heading.routes"
        text="Routes"
        actions={<Button id="btn.new-route" label="Define route..." emphasis="primary" to="screen.new-route" />}
      />
      <Section id="section.routes" title="Defined routes" count={all.items.length}>
        <Table
          id="table.routes"
          columns={["Route", "Stops"]}
          rows={all.items.map((r) => ({
            id: `route.${r.id}`,
            cells: [r.name, `${r.stopsCount} stops`],
            to: "screen.new-route",
            params: { route: r.id },
            actions: [{ id: `route.${r.id}.edit`, label: "Edit", to: "screen.new-route", params: { route: r.id } }],
          }))}
          empty={<Text id="text.empty-routes" text="No routes defined yet." tone="secondary" />}
        />
      </Section>
    </Shell>
  );
}

function NewRoute() {
  const navigate = useNav();
  const [stops, setStops] = useState<string[]>(["Main St & 1st", "Main St & 5th", "Central Station"]);
  return (
    <Shell>
      <Heading id="heading.new-route" text="Define route" />
      <Form
        id="form.new-route"
        onSubmit={() => navigate.go("screen.routes")}
        actions={
          <Stack direction="row">
            <Button id="btn.cancel" label="Cancel" to="screen.routes" />
            <Button id="btn.save-route" label="Save route" emphasis="primary" submit />
          </Stack>
        }
      >
        <Field id="field.route-name" label="Route name" required />
      </Form>
      <Section id="section.stops" title="Stops" count={stops.length} subtitle="Visited in this order." actions={
        <Button id="btn.add-stop" label="Add stop..." onPress={() => setStops((s) => [...s, `Stop ${s.length + 1}`])} />
      }>
        <Stack>
          {stops.map((stop, i) => (
            <Text key={stop} id={`text.stop-${i}`} text={`Stop ${i + 1}: ${stop}`} />
          ))}
        </Stack>
      </Section>
    </Shell>
  );
}

function Account() {
  const role = useRole() as keyof typeof users;
  const user = users[role] ?? users.FleetAdmin;
  return (
    <Shell>
      <Heading id="heading.account" text="Account" />
      <Detail id="detail.account" fields={[{ label: "Name", value: user.name }, { label: "Email", value: user.email }]} />
    </Shell>
  );
}

function Settings() {
  return (
    <Shell>
      <Heading id="heading.settings" text="Settings" />
      <Form
        id="form.settings"
        actions={<Button id="btn.save-settings" label="Save settings" emphasis="primary" submit />}
      >
        <Field id="field.offline-alerts" label="Warn me when a bus goes offline" type="switch" defaultValue="on" />
      </Form>
    </Shell>
  );
}

function SignedOut() {
  return (
    <Screen>
      <Heading id="heading.signed-out" text="You are signed out" />
      <Button id="btn.sign-in" label="Sign in" emphasis="primary" to="screen.fleet-map" />
    </Screen>
  );
}

export default defineApp({
  screens: {
    "screen.fleet-map": FleetMap,
    "screen.buses": Buses,
    "screen.new-bus": NewBus,
    "screen.devices": Devices,
    "screen.new-device": NewDevice,
    "screen.routes": Routes,
    "screen.new-route": NewRoute,
    "screen.account": Account,
    "screen.settings": Settings,
    "screen.signed-out": SignedOut,
  },
  data: { buses, devices, routes, fleetPositions },
});
