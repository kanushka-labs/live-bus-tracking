import { type ReactNode } from "react";
import {
  Alert, AppShell, Badge, Button, Detail, Field, Form, Heading, Screen, Section, Stack, Text,
  Table, defineApp, useCollection, useDisplayState,
} from "@wso2/prototype-kit";

interface BusPosition {
  id: string;
  bus: string;
  route: string;
  status: string;
  lastSeen: string;
}

const busPositions: BusPosition[] = [
  { id: "bus.12", bus: "Bus 12", route: "Route 4", status: "On route", lastSeen: "just now" },
  { id: "bus.7", bus: "Bus 7", route: "Route 2", status: "Offline", lastSeen: "6 min ago" },
  { id: "bus.3", bus: "Bus 3", route: "Route 4", status: "On route", lastSeen: "10 sec ago" },
  { id: "bus.21", bus: "Bus 21", route: "Route 1", status: "On route", lastSeen: "25 sec ago" },
  { id: "bus.15", bus: "Bus 15", route: "Route 2", status: "Offline", lastSeen: "12 min ago" },
];

const user = { name: "Riya Fernando", email: "riya.fernando@example.com" };

function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      id="shell"
      user={user}
      nav={[{ id: "nav.live-map", label: "Live map", to: "screen.live-map" }]}
      account="screen.account"
      settings="screen.settings"
      signOut="screen.signed-out"
    >
      {children}
    </AppShell>
  );
}

function LiveMap() {
  const state = useDisplayState();
  const all = useCollection<BusPosition>("busPositions");
  const buses = state === "state.empty" ? [] : all.items;
  return (
    <Shell>
      <Heading id="heading.live-map" text="Live map" />
      <Stack direction="row">
        <Field id="field.search" label="Search route or bus" />
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
          text="Map showing every bus as a pin: color for on-route, muted pin with an Offline badge for a bus with no update in over 2 minutes."
        />
      </Section>
      <Section id="section.buses" title="Buses" count={buses.length} subtitle="Every bus's current position and route.">
        <Table
          id="table.buses"
          columns={["Bus", "Route", { label: "Status", kind: "status" }, "Last seen"]}
          rows={buses.map((b) => ({
            id: `row.${b.id}`,
            cells: [b.bus, b.route, b.lastSeen],
            status: { text: b.status, tone: b.status === "Offline" ? "default" : "success" },
          }))}
          empty={<Text id="text.empty-buses" text="No buses are reporting right now." tone="secondary" />}
        />
      </Section>
    </Shell>
  );
}

function Account() {
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
        <Field id="field.digest" label="Notify me when my favorite route goes offline" type="switch" defaultValue="off" />
      </Form>
    </Shell>
  );
}

function SignedOut() {
  return (
    <Screen>
      <Heading id="heading.signed-out" text="You are signed out" />
      <Button id="btn.sign-in" label="Sign in" emphasis="primary" to="screen.live-map" />
    </Screen>
  );
}

export default defineApp({
  screens: {
    "screen.live-map": LiveMap,
    "screen.account": Account,
    "screen.settings": Settings,
    "screen.signed-out": SignedOut,
  },
  data: { busPositions },
});
