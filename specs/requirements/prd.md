# Live Bus Tracking

## Problem Statement

Transit riders have no way to know where their bus actually is, so they wait
blind and often miss it or arrive too early. Dispatchers and fleet staff have
no live view of the fleet either, so a delayed or offline bus is only noticed
when a rider complains. Today the only "tracking" is the printed timetable.

## Solution

A live bus tracking system: GPS devices on each bus continuously report their
location, the system keeps the latest position per bus, and riders,
dispatchers and fleet admins each see that live data through a map suited to
their role. Fleet admins set up the buses, devices and routes the rest of the
system relies on.

## Actors

- **Rider**: a signed-in user who views the live map to see where buses
currently are and plan their trip.
- **Dispatcher**: a signed-in user who monitors the full live fleet in real
time, watching for delays, deviations or buses that have gone offline.
- **Fleet Admin**: a signed-in user who registers buses and their GPS
devices, and defines routes and stops.

## Features

- F1 [Fleet &amp; route management](features/F1-fleet-and-route-management.md)
- F2 [Live location ingestion](features/F2-live-location-ingestion.md)
- F3 [Live map](features/F3-live-map.md)

## Product-wide

See [Product-wide](product-wide.md) for sign-in, device authentication and
update-frequency rules that apply across features.

## Out of Scope

- ETA / arrival predictions at a stop.
- Trip history &amp; playback (reporting on past trips).
- Alerts &amp; notifications (delay or deviation alerts to riders or dispatchers).