screen FleetMap "Every bus on the fleet, with device and staleness detail"
  navbar "Fleet Ops"
  sidebar "Fleet map -> FleetMap | Buses -> Buses | Devices -> Devices | Routes -> Routes"
  heading "Fleet map"
  row
    search "Search bus or device"
    right
    badge "Updates every few seconds" info
  card "Map"
    text "Map showing every bus as a pin, color for on-route, muted + 'Offline' badge when stale"
  table "Bus | Route | Device ID | Last update | Status"
    row "Bus 12 | Route 4 | DEV-0012 | just now | On route"
    row "Bus 7 | Route 2 | DEV-0007 | 6 min ago | Offline"

screen Buses "Registered buses"
  navbar "Fleet Ops"
  sidebar "Fleet map -> FleetMap | Buses -> Buses | Devices -> Devices | Routes -> Routes"
  row
    heading "Buses"
    right
    button "Register bus..." primary -> NewBus
  table "License plate | Route | Active | -"
    row "ABC-123 | Route 4 | Yes | Deactivate"
    row "XYZ-789 | Unassigned | No | Activate"

screen NewBus "Register a new bus"
  navbar "Fleet Ops"
  heading "Register bus"
  input "License plate"
  row
    button "Cancel" -> Buses
    right
    button "Register" primary -> Buses

screen Devices "Registered GPS devices"
  navbar "Fleet Ops"
  sidebar "Fleet map -> FleetMap | Buses -> Buses | Devices -> Devices | Routes -> Routes"
  row
    heading "GPS devices"
    right
    button "Register device..." primary -> NewDevice
  table "Device ID | Assigned bus | Active | Last update | -"
    row "DEV-0012 | ABC-123 | Yes | just now | Reassign"
    row "DEV-0007 | XYZ-789 | No | 6 min ago | Reassign"

screen NewDevice "Register a GPS device"
  navbar "Fleet Ops"
  heading "Register device"
  select "Assign to bus"
  row
    button "Cancel" -> Devices
    right
    button "Register" primary -> Devices

screen Routes "Defined routes and stops"
  navbar "Fleet Ops"
  sidebar "Fleet map -> FleetMap | Buses -> Buses | Devices -> Devices | Routes -> Routes"
  row
    heading "Routes"
    right
    button "Define route..." primary -> NewRoute
  table "Route | Stops | -"
    row "Route 4 | 6 stops | Edit"
    row "Route 2 | 4 stops | Edit"

screen NewRoute "Define a route"
  navbar "Fleet Ops"
  heading "Define route"
  input "Route name"
  list "Stop 1: Main St & 1st | Stop 2: Main St & 5th | Stop 3: Central Station"
  button "Add stop..."
  row
    button "Cancel" -> Routes
    right
    button "Save route" primary -> Routes

flow "Manage fleet"
  role "Fleet Admin"
  description "A fleet admin registers buses, devices and routes"
  Buses
  NewBus
  Devices
  NewDevice
  Routes
  NewRoute

flow "Monitor fleet"
  role "Dispatcher"
  description "A dispatcher watches the whole fleet in real time"
  FleetMap
