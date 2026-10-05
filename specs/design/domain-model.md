# Domain model

The fleet is the spine: a bus carries one reassignable GPS device and runs at
most one route at a time; a route is an ordered sequence of stops. Every
location update refreshes the bus's one current position.

```mermaid
erDiagram
    BUS ||--o| GPSDEVICE : "has assigned"
    BUS ||--o| ROUTE : "runs"
    ROUTE ||--|{ STOP : "visits in order"
    BUS ||--|| POSITION : "latest"

    BUS {
        string id
        string licensePlate
        boolean active
    }
    GPSDEVICE {
        string id
        string secretHash
        boolean active
        string busId FK
    }
    ROUTE {
        string id
        string name
    }
    STOP {
        string id
        string routeId FK
        string name
        float lat
        float lng
        int sequence
    }
    POSITION {
        string busId FK
        float lat
        float lng
        datetime reportedAt
        boolean offline
    }
```

- A `GPSDEVICE` is reassigned between buses; its `busId` changes, the device
row itself does not.
- A `BUS` can run only one `ROUTE` at a time; reassigning replaces the link.
- `POSITION` holds one row per bus — the latest report, not a history — with
`offline` computed from how long ago `reportedAt` was.