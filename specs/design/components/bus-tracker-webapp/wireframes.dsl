screen LiveMap "Every bus's current position and route, on one live map"
  navbar "Bus Tracker"
  heading "Live map"
  row
    search "Search route or bus"
    right
    badge "Updates every few seconds" info
  card "Map"
    text "Map showing every bus as a pin: color for on-route, muted pin + 'Offline' badge for a bus with no update in over 2 minutes"
  table "Bus | Route | Status | Last seen"
    row "Bus 12 | Route 4 | On route | just now"
    row "Bus 7 | Route 2 | Offline | 6 min ago"

flow "Track buses"
  role "Rider"
  description "A rider checks where every bus currently is"
  LiveMap
