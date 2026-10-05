# Fleet &amp; route management

## Purpose

Fleet admins register the buses and GPS devices the rest of the system relies
on, and define the routes and stops riders and dispatchers see.

## User Stories

- F1.1 As a fleet admin, I register a bus.
- F1.2 As a fleet admin, I register a GPS device, issuing it the ID and secret/token it authenticates with, and assign it to a bus.
- F1.3 As a fleet admin, I reassign a GPS device to a different bus.
- F1.4 As a fleet admin, I mark a bus or a GPS device active or inactive.
- F1.5 As a fleet admin, I define a route as an ordered sequence of named stops, each with a location.
- F1.6 As a fleet admin, I assign a bus to a route, and change that assignment later.

## Decisions

- A GPS device's ID and secret/token are generated at registration; the device presents them with every location update (P2).
- A bus can run only one route at a time; reassigning it to another route replaces the previous assignment.