// The app chrome, laid out exactly as oxygen-ui-design-system's sample
// (sample/src/layouts/AppLayout.tsx): AppShell > Navbar (Header: toggle,
// brand, spacer, actions) > Sidebar (nav items) > Main (routed page) >
// Footer. Every gated screen in App.tsx renders inside this, through
// <Outlet />.
//
// Navigation lives in the sidebar only — the header carries no nav items,
// per the design system's rule and the wireframes' shared `sidebar` string.

import type { ReactElement } from "react";
import { Link as RouterLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  ColorSchemeToggle,
  Footer,
  Header,
  Sidebar,
  UserMenu,
  version as OXYGEN_UI_VERSION,
} from "@wso2/oxygen-ui";
import { Map, Bus, Satellite, Route, Settings, LogOut } from "@wso2/oxygen-ui-icons-react";
import { SCREEN_ROUTES } from "../authz/screens";
import { signOut } from "../authz/session";
import { useAuthz, useHeldRoles } from "../authz/gates";

const ICON_BY_KEY: Record<string, ReactElement> = {
  fleetmap: <Map />,
  buses: <Bus />,
  devices: <Satellite />,
  routes: <Route />,
};

export function AppShell(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useAuthz();
  const roles = useHeldRoles();
  const activeItem = SCREEN_ROUTES.find((screen) => screen.path === location.pathname)?.key;
  const roleLabel = roles.length > 0 ? roles.join(", ") : undefined;

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>Fleet Ops</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email={username} role={roleLabel} />
              <UserMenu.Item
                icon={<Settings />}
                label="Settings"
                onClick={() => navigate("/settings")}
              />
              <UserMenu.Divider />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={activeItem}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {SCREEN_ROUTES.map((screen) => (
                <Sidebar.Item key={screen.key} id={screen.key} link={<RouterLink to={screen.path} />}>
                  <Sidebar.ItemIcon>{ICON_BY_KEY[screen.key]}</Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>{screen.label}</Sidebar.ItemLabel>
                </Sidebar.Item>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
          <Sidebar.Footer>
            <Sidebar.Category>
              <Sidebar.Item id="settings" link={<RouterLink to="/settings" />}>
                <Sidebar.ItemIcon>
                  <Settings />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Settings</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Sidebar.Category>
          </Sidebar.Footer>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© {new Date().getFullYear()} Fleet Ops</Footer.Copyright>
          <Footer.Divider />
          <Footer.Version>oxygen-ui-v{OXYGEN_UI_VERSION}</Footer.Version>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
