# Live location ingestion

## Purpose

Receives and stores the location a bus's GPS device reports, keeping each
bus's latest position current for the live map.

Needs: F1.

## User Stories

- F2.1 As a GPS device, I submit my bus's current position and the time it was taken, authenticated with my registered ID and secret/token.
- F2.2 As a GPS device, when my ID is unrecognized or marked inactive, my submission is rejected with an error I can see.

## Decisions

- Each location update carries the bus's position and the time it was taken.
- A bus is marked offline when no location update has arrived for more than 2 minutes.
- An update from an unrecognized device ID is rejected with an error; an update from a known but inactive device is also rejected (P4).

