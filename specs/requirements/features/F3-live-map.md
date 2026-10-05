# Live map

## Purpose

Shows riders and dispatchers where buses currently are, each on a map suited
to their role — a rider plans a trip, a dispatcher watches the whole fleet.

Needs: F1, F2.

## User Stories

- F3.1 As a rider, I see every bus on a live map, each showing its current position and the route it's running.
- F3.2 As a dispatcher, I see every bus on the fleet on one map, each showing its position, route, device ID and the time of its last update.

## Decisions

- An offline bus (per F2) stays on the map, marked offline, at its last known position — for riders and dispatchers alike.
- Both roles see every bus on one map; only the per-bus detail shown differs — a dispatcher additionally sees device ID and last-update time.

